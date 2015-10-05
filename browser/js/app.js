/**
 * Created by philippe_simpson on 01/10/15.
 */

var socket = io('https://quiet-beyond-3424.herokuapp.com/');//http://localhost:8080');

// views
var frontView = document.querySelector('#frontView');
var waitView = document.querySelector('#waitView');
var gameView = document.querySelector('#gameView');

var consoleEl = document.querySelector('#messages');
var scoreYouEl = document.querySelector('#scoreYou');
var scoreOppEl = document.querySelector('#scoreOpponent');
var roundEl = document.querySelector('#round');
var resultEl = document.querySelector('#result');

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

function getImage(weapon) {
    var el;
    switch (weapon) {
        case "rock":
                el = '<img src="images/rock.png" >';
                break;
        case "paper":
            el = '<img src="images/paper.png" >';
            break;
        case "scissors":
            el = '<img src="images/scissors.png" >';
            break;
        default:
            el = '<img src="images/help.png" >';
    }

    return el;
}

socket.on('message', function(msg){
    consoleEl.innerHTML = msg;
});

socket.on('mandown', function(){ // opponent disconnected
    gameView.setAttribute('class', 'hide'); // hide
    frontView.setAttribute('class', 'hide'); // hide
    waitView.setAttribute('class', ''); // show
});

socket.on('waiting', function(name){
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
        you.innerHTML = getImage(weapon);
    } else { // opponent
        var opp = document.querySelector('#weaponOpponent');
        opp.innerHTML = getImage();
    }

});

socket.on('score', function(player1, player2, message, round){
    if(player1.id === socket.id){ // you
        scoreYouEl.innerHTML = player1.wins;
        scoreOppEl.innerHTML = player2.wins;
        document.querySelector('#weaponOpponent').innerHTML = getImage(player2.weapon);
    } else { // opponent
        scoreOppEl.innerHTML = player1.wins;
        scoreYouEl.innerHTML = player2.wins;
        document.querySelector('#weaponOpponent').innerHTML = getImage(player1.weapon);
    }

    roundEl.innerHTML = round;

    setTimeout(function(){
        resultEl.innerHTML = message;
    }, 300);
});

socket.on('result', function(result){
    var you = document.querySelector('#weaponYou');
    var opp = document.querySelector('#weaponOpponent');

    if(result.winner){
        if(result.winner.id === socket.id){ // you win
            you.innerHTML = getImage(result.winner.weapon);
            opp.innerHTML = getImage(result.looser.weapon);
        } else { // opponent wins
            you.innerHTML = getImage(result.looser.weapon);
            opp.innerHTML = getImage(result.winner.weapon);
        }
    } // else Tie.

    setTimeout(function(){
        resultEl.innerHTML = result.msg;
    }, 300);
});