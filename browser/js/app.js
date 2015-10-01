/**
 * Created by philippe_simpson on 01/10/15.
 */

var socket = io('http://localhost:8080');

var username; // you

// views
var frontView = document.querySelector('#frontView');
var waitView = document.querySelector('#waitView');
var gameView = document.querySelector('#gameView');

var consoleEl = document.querySelector('#messages');
var scoreEl = document.querySelector('#score');

var btnStart = document.querySelector('#start');
btnStart.addEventListener('click', startGame);

var btnRock = document.querySelector('#rock');
btnRock.addEventListener('click', onRock);
var btnPaper = document.querySelector('#paper');
btnPaper.addEventListener('click', onPaper);
var btnScissors = document.querySelector('#scissors');
btnScissors.addEventListener('click', onScissors);

function startGame(){
    socket.emit('start', 'Mr. Smith');
}

function onRock() {
    socket.emit('choice', "rock");
}
function onPaper() {
    socket.emit('choice', "paper");
}
function onScissors() {
    socket.emit('choice', "scissors");
}

socket.on('message', function(msg){
    consoleEl.innerHTML = msg;
});

socket.on('waiting', function(name){
    username = name; // registered name for user
    frontView.setAttribute('class', 'hide'); // hide
    waitView.setAttribute('class', ''); // show
});

socket.on('start', function(){
    waitView.setAttribute('class', 'hide'); // hide
    gameView.setAttribute('class', ''); // show
});

socket.on('choice:confirmed', function(weapon){
    if(weapon){ // user You
        var you = document.querySelector('#weaponYou');
        you.innerHTML = weapon;
    } else { // opponent
        var opp = document.querySelector('#weaponOpponent');
        opp.innerHTML = "? ? ?";
    }

});

socket.on('score', function(msg){
    scoreEl.innerHTML = msg;
});

socket.on('result', function(user1, user2){
    //scoreEl.innerHTML = msg;
    //console.log("result", msg1, msg2);

    var test = [user1, user2];

    test.forEach(function(element){
        if(element.name === username){
            var you = document.querySelector('#weaponYou');
            you.innerHTML = element.weapon;
        } else {
            var opp = document.querySelector('#weaponOpponent');
            opp.innerHTML = element.weapon;
        }
    });
});