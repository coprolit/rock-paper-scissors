/**
 * Created by philippe_simpson on 01/10/15.
 */

//var socket = io('https://quiet-beyond-3424.herokuapp.com/');
var socket = io('http://localhost:8080'); // for debugging

// views
var frontView = document.querySelector('#frontView');
var waitView = document.querySelector('#waitView');
var gameView = document.querySelector('#gameView');

var consoleEl = document.querySelector('#messages');
var scoreYouEl = document.querySelector('#scoreYou');
var scoreOppEl = document.querySelector('#scoreOpponent');
var roundEl = document.querySelector('#round');
var resultEl = document.querySelector('#result');
var selectorEl = document.querySelector('#weapon-selector');
var weaponChosenYou = document.querySelector('#weaponYou');
var weaponChosenOpp = document.querySelector('#weaponOpponent');

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
                el = '<img src="images/rock_100x100.png" >';
                break;
        case "paper":
            el = '<img src="images/paper_100x100.png" >';
            break;
        case "scissors":
            el = '<img src="images/scissors_100x100.png" >';
            break;
        default:
            el = '<img style="transform: scaleX(1);" src="images/help.png" >';
    }
    return el;
}

function reset(){ // reset UI between rounds
    weaponChosenYou.innerHTML = '';
    weaponChosenOpp.innerHTML = '';
    resultEl.innerHTML = '';
    selectorEl.setAttribute('class', ''); // show
}

socket.on('reset', function(){
    reset();
});

socket.on('message', function(msg){
    consoleEl.innerHTML = msg;
});

socket.on('restart', function(){ // opponent disconnected, return to start screen
    //console.log('on restart');
    gameView.setAttribute('class', 'hide'); // hide
    waitView.setAttribute('class', 'hide'); // hide
    scoreYouEl.innerHTML = 0;
    scoreOppEl.innerHTML = 0;
    roundEl.innerHTML = 0;
    reset();
    frontView.setAttribute('class', ''); // show
});

socket.on('waiting', function(){ // we're ready, let's wait for opponent
    //console.log('on waiting');
    consoleEl.innerHTML = '';
    frontView.setAttribute('class', 'hide'); // hide
    waitView.setAttribute('class', ''); // show
});

socket.on('start', function(){ // both clients are ready, let the game begin
    //console.log('on start');
    waitView.setAttribute('class', 'hide'); // hide
    gameView.setAttribute('class', ''); // show
});

socket.on('choice:confirmed', function(weapon){
    if(weapon){ // user You
        weaponChosenYou.innerHTML = getImage(weapon);
        selectorEl.setAttribute('class', 'hide'); // hide
    } else { // opponent
        weaponChosenOpp.innerHTML = getImage();
    }
});

socket.on('result', function(player1, player2, result, round){
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

    var msg = result.msg;
    if(result.winner){
        msg = msg + (result.winner.id === socket.id ? '<h2 class="win">You win!</h2>' : '<h2 class="loose">You loose!</h2>');
    }

    setTimeout(function(){
        resultEl.innerHTML = msg;
    }, 300);
});