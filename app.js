document.addEventListener('DOMContentLoaded', () => {
    //create all constants and variables needed
    const grid = document.querySelector('.grid');
    const width = 8;
    const squares = []; //tracks every div in the grid
    const emojiTypes = ['url(purple.png)', 'url(ghost.png)','url(pumpkin.png)'] //emoji options for a div

    let visited = new Set(); //set keeps track of the divs that were visted already
    let toVisit = []; //array treated as a stack keeps track of divs to be visited
    let group = new Set(); //keeps track of current crowd being looked at
    let totalCrowds = []; //stores all the crowds in the board 

    let totalMoves = 0; 
    let level =0;
    let score = 0;

    var refill = new sound("refill.mp3");
    var success = new sound("success.mp3");
    var failure = new sound("failure.mp3");

    //splits the URL to get the part containing userinput and alters totalMoves based on level choosen
    var url = document.location.href,
        params = url.split('?')[1].split('&'),
        data = {}, tmp;
        console.log(params);
        if(params[0] === "level=easy"){
            totalMoves = 50;
            level=3;
        }else if(params[0] === "level=medium"){
            totalMoves = 35;
            level=2;
        }else if(params[0] === "level=hard"){
            totalMoves = 20;
            level=1;
        }
    
    //iterates extracted portion of URL ("level=xyz") to further extract the level entered by the user
    for (var i = 0, l = params.length; i < l; i++) {
         tmp = params[i].split('=');
         data[tmp[0]] = tmp[1];
    }

    //data.level stores "easy", "medium" or "hard"
    document.getElementById('here').innerHTML = "Level: " + data.level;
  
    let movesLeft=totalMoves; //tracks the total moves the user has left

    //writes the total moves left to the trackMoves div in the html file 
    let moveTag = document.getElementById('trackMoves');
    moveTag.innerHTML = "Moves Left: " + movesLeft;

    createBoard(); //creates the width x width board
    findCrowds(); //finds the crowds on starting grid and stores the crowds in the array totalCrowds

    /*createBoard function creates the grid and adds divs within the grid,
        every div is stored in the squares array and will include a random emoji and onclick event */
    function createBoard() {
        for (let i = 0; i < width; i++) {
            squares[i] = [];
            for(let j = 0; j < width; j++){
                const square = document.createElement('div');
                square.setAttribute('id', i+ '' + j);
                square.onclick = function() { clickEvent(i,j) };
                let randomEmoji = Math.floor(Math.random() * emojiTypes.length);
                square.style.backgroundImage = emojiTypes[randomEmoji];
                grid.appendChild(square);
                squares[i].push(square);
             
            }
    
        }
    }
   
    /*clickEvent function is called everytime a user clicks on a div in the grid and updates the state of the grid*/
    function clickEvent(x,y){ 
        //the total amount of moves left is updated adn displayed on the html file
        movesLeft--;
        moveTag.innerHTML = "Moves Left: " + movesLeft;

        checkAndRemoveGroup(x,y); //function checks if clicked div belongs in a valid group and if it is the group is removed 
        dropSquaresDown(); //updates the state of the divs in teh grid based on clicked div
    
        //refills the grid if there are no more crowds displayed and the user still has more moves
        if(totalCrowds.length == 0 && movesLeft < totalMoves && movesLeft > 0){
            score+=100 //user recieves a bonus refill score 
            refillBoard();
        }

        //the total score is updated and displayed on the html file
        let scoreTag = document.getElementById('trackScore');
        scoreTag.innerHTML = "Score: " + score;

        //checks if the user has no more moves and updates the html file to display the end of the game with total score
        if(movesLeft==0){
           document.getElementsByTagName('body')[0].innerHTML = "<h1 class='h1'>GAME OVER!<br>" + "Final Score is: " + score + "</h1>";
        }
      }


    /* function checkAdj takes in a div and checks every side of the div and the divs adjacent to its sides 
        and stops checking that side once there is no match found.
        If there are emoji matches found, then the div is stored in the stack toVisit to be checked later. 
    */
    function checkAdj(x, y){
        let i = parseInt(x);
        let j = parseInt(y);
        let color = squares[x][y].style.backgroundImage;
        let curri = i;
        let currj = j+1;
        while(currj < width){ //checks right side of the div and adds to the stack toVisit if sharing the same emoji
            if (squares[curri][currj].style.backgroundImage == color && squares[curri][currj].style.backgroundImage != ''){
                if(!visited.has(curri+''+currj)){
                    toVisit.push(squares[curri][currj].getAttribute('id'));
                }
                currj++;
            }else{
                currj = j+1;
                break;
            }
        }
        curri = i-1;
        currj = j;
        while(curri < width && curri != -1){ //checks top side of the div and adds to the stack toVisit if sharing the same emoji
            if (squares[curri][currj].style.backgroundImage == color && squares[curri][currj].style.backgroundImage != ''){
                if(!visited.has(curri+''+currj)){
                    toVisit.push(squares[curri][currj].getAttribute('id'));
                }
                curri--;
            }else{
                curri = i-1;
                break;
            }
        }
        curri = i+1;
        currj = j;
        while(curri < width && curri != width){ //checks bottom side of the div and adds to the stack toVisit if sharing the same emoji
            if (squares[curri][currj].style.backgroundImage == color && squares[curri][currj].style.backgroundImage != ''){
                if(!visited.has(curri+''+currj)){
                    toVisit.push(squares[curri][currj].getAttribute('id'));
                }
                curri++;
            }else{
                curri = i+1;
                break;
            }
        }
        curri = i;
        currj = j-1;
        while(currj < width && currj != -1){ //checks left side of the div and adds to the stack toVisit if sharing the same emoji
            if (squares[curri][currj].style.backgroundImage == color && squares[curri][currj].style.backgroundImage != ''){
                if(!visited.has(curri+''+currj)){
                    toVisit.push(squares[curri][currj].getAttribute('id'));
                }
                currj--;
            }else{
                currj = j-1;
                break;
            }
        }
    }

    /*findCrowds function loops through the divs in the grid. If the div has not been visited then we find all its adjacent 
    matches which are added to the toVisit stack. While the toVist stack has divs to be visited, we pop every div and visit its adjacent
    matches to find the complete crowd. Once the stack is empty, the complete crowd has been found and if the 
    crowd contains 4 or more elements then it is stored in the array totalCrowds
    */
    function findCrowds(){
        totalCrowds = []; 
        visited.clear();
        group.clear();
        toVisit=[];
        for (let row = 0; row < width; row++) {
            for(let col = 0; col < width; col++){
                let divID = row+''+col;
                if(!visited.has(divID)){
                    visited.add(divID);
                    checkAdj(row, col); 
                    group.add(divID);
                    while(toVisit.length > 0){
                        let divToVisit = toVisit.shift();
                        visited.add(divToVisit);
                        checkAdj(divToVisit.charAt(0), divToVisit.charAt(1));
                        group.add(divToVisit); 
                    }
                }
                if(group.size >= 4){
                    totalCrowds.push(group);
                }
                group = new Set();
    
            }
            
        }
    }
    
    /*called when totalCrowds has no more groups of 4 or more
      iterates through every row and column of grid
      changes image of blank squares in grid to random image
      calls findCrowds once before next onclick to re-calculate totalCrowds 
      i.e. recalculate new groups of four or more
    */
    function refillBoard(){
        refill.play();
        if(movesLeft<totalMoves){
            for (let i = 0; i < width; i++) {
                for(let j = 0; j < width; j++){
                    if(squares[i][j].style.backgroundImage==''){
                        let randomEmoji = Math.floor(Math.random() * emojiTypes.length);
                        squares[i][j].style.backgroundImage = emojiTypes[randomEmoji];
                    
                    }     
                }
            }
            findCrowds(); 
        }
    }
 

    /*checks if clicked square is in group of four or more and if so, turn entire group blank
    */
    function checkAndRemoveGroup(x,y){
        let clickeddivID = x + '' + y;
        var foundGroup=false;
        for(let i=0;i<totalCrowds.length;i++){
            let oneGroup=totalCrowds[i];
            console.log(oneGroup);
            if(oneGroup.has(clickeddivID)){
                computeScore(oneGroup.size);
                foundGroup=true;
                for (var it = oneGroup.values(), val= null; val=it.next().value; ) {
                    let row=(val/10)|0;
                    let column=val%10;
                    squares[row][column].style.backgroundImage = '';
                }
            }
        }
        if(foundGroup==true){
            console.log("FOUND GROUP")
            success.play();
        }
        else{
            failure.play();
        }
    }
    
    /*function to drop squares down if a group has been detected and deleted
    */
   function dropSquaresDown(){
    //iterate through all rows starting from bottom
    //iterate through all columns starting from left
    //pick the square
    //while you havent checked upto the top row
    //drop down square in above row if not blank and make above square blank and break
        for (let row = width-1; row >0; row--) {
            for(let column = 0; column < width; column++) {
                if(squares[row][column].style.backgroundImage == '') {
                    for(let check=row-1; check>-1; check--){
                        if(squares[check][column].style.backgroundImage != ''){
                            squares[row][column].style.backgroundImage = squares[check][column].style.backgroundImage;
                            squares[check][column].style.backgroundImage='';
                            break;
                        }
                    }
                }
            }
        }
        //find new crowds
        findCrowds();
      
   }

   /*function to compute score based on level and size of group
    */
   function computeScore(size){
       score=(level*(size-3)*(size))+score;
   }

   /*created a sound object with play pause methods
   */
   function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
        this.sound.play();
    }
    this.stop = function(){
        this.sound.pause();
    }    
}

})
