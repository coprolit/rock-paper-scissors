/**
 * Created by philippe_simpson on 01/10/15.
 */
"use strict";

//var url = 'http://localhost:8080';
var url = 'https://quiet-beyond-3424.herokuapp.com/';
var socket = io(url);

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
/*
function joinGame(){
    var sessionID = 1;
    socket.emit('join', sessionID);
}
*/
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

function countDown(){
    return new Promise(function(resolve, reject) {

        var iterator = function*(){ // Generator iterator
            yield "1";
            yield "2";
            yield "3";
            yield "throw!";
        }();

        function iterate(){
            var count = iterator.next();
            if(!count.done){
                resultEl.innerHTML = '<h1>' + count.value + '</h1>';
                setTimeout(iterate, 800);
            } else {
                resolve();
            }
        }

        iterate();
    });
}

socket.on('connect', function(){
    var session = getUrlVars()["session"];
    if(session){
        socket.emit('join', session);
    }
});

socket.on('reset', function(){
    reset();
});

socket.on('message', function(msg){
    consoleEl.innerHTML = msg;
});

socket.on('restart', function(){ // opponent disconnected, return to start screen
    alert("Opponent fled.");
    gameView.setAttribute('class', 'hide'); // hide
    waitView.setAttribute('class', 'hide'); // hide
    scoreYouEl.innerHTML = 0;
    scoreOppEl.innerHTML = 0;
    roundEl.innerHTML = 0;
    reset();
    frontView.setAttribute('class', ''); // show
    socket.emit('restart:done');
});

socket.on('waiting', function(sessionID){ // we're ready, let's wait for opponent
    consoleEl.innerHTML = '';
    frontView.setAttribute('class', 'hide'); // hide
    waitView.setAttribute('class', ''); // show
    var el = waitView.querySelector('.invite-url');
    el.innerHTML = "?session=" + sessionID;
});

socket.on('start', function(){ // both clients are ready, let the game begin
    frontView.setAttribute('class', 'hide'); // hide
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

socket.on('result', function(data){
    countDown().then(function(){
        showResult(data);
    });
});

function showResult(result){
    /*
    var data = {
        round: session.round,
        p1Id: player1.socket.id,
        p1Wins: player1.wins,
        p1Weapon: player1.weapon,
        p2Id: player2.socket.id,
        p2Wins: player2.wins,
        p2Weapon: player2.weapon,
        resultMessage: result.msg,
        winnerId: result.winner ? result.winner.socket.id : null
    };
    */

    if(result.p1Id === socket.id){ // you
        scoreYouEl.innerHTML = result.p1Wins;
        scoreOppEl.innerHTML = result.p2Wins;
        document.querySelector('#weaponOpponent').innerHTML = getImage(result.p2Weapon);
    } else { // opponent
        scoreOppEl.innerHTML = result.p1Wins;
        scoreYouEl.innerHTML = result.p2Wins;
        document.querySelector('#weaponOpponent').innerHTML = getImage(result.p1Weapon);
    }

    roundEl.innerHTML = result.round;

    var msg = result.resultMessage;
    if(result.winnerId){
        msg = msg + (result.winnerId === socket.id ? '<h2 class="win">You win!</h2>' : '<h2 class="loose">You loose!</h2>');
    }

    setTimeout(function(){
        resultEl.innerHTML = msg;
    }, 1000);
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
        function(m,key,value) {
            vars[key] = value;
        });
    return vars;
}

