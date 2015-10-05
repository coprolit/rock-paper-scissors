/**
 * Created by philippe_simpson on 01/10/15.
 */

var socket = io('https://quiet-beyond-3424.herokuapp.com/');//http://localhost:8080');

// views
var frontView = document.querySelector('#frontView');
var waitView = document.querySelector('#waitView');
var gameView = document.querySelector('#gameView');

//var consoleEl = document.querySelector('#messages');
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
            el = '<img src="images/help.png" >';
    }
    return el;
}

function reset(){ // reset UI for next duel
    weaponChosenYou.innerHTML = '';
    weaponChosenOpp.innerHTML = '';
    resultEl.innerHTML = '';
    selectorEl.setAttribute('class', ''); // show
}

socket.on('reset', function(){
    reset();
});
/*
socket.on('message', function(msg){
    consoleEl.innerHTML = msg;
});
*/
socket.on('restart', function(){ // opponent disconnected, return to start screen
    gameView.setAttribute('class', 'hide'); // hide
    waitView.setAttribute('class', 'hide'); // hide
    scoreYouEl.innerHTML = '';
    scoreOppEl.innerHTML = '';
    roundEl.innerHTML = '';
    reset();
    frontView.setAttribute('class', ''); // show
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
        //var you = document.querySelector('#weaponYou');
        weaponChosenYou.innerHTML = getImage(weapon);
        selectorEl.setAttribute('class', 'hide'); // hide
    } else { // opponent
        //var opp = document.querySelector('#weaponOpponent');
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
        //setTimeout(reset, 3000);
    }, 300);
});
/*
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
*/