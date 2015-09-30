/**
 * Created by philippe_simpson on 29/09/15.
 */

var socket = io();

var consoleEl = document.querySelector('#messages');

var btnRock = document.querySelector('#rock');
btnRock.addEventListener('click', onRock);

var btnPaper = document.querySelector('#paper');
btnPaper.addEventListener('click', onPaper);

var btnScissors = document.querySelector('#scissors');
btnScissors.addEventListener('click', onScissors);

function onRock() {
    socket.emit('choice', "rock");
}

function onPaper() {
    socket.emit('choice', "paper");
}

function onScissors() {
    socket.emit('choice', "scissors");
}

socket.on('result', function(msg){
    var li = document.createElement('li');
    li.innerHTML = msg;
    consoleEl.appendChild(li);
});

socket.on('ready', function(){
    var waitEl = document.querySelector('#waiting');
    waitEl.style['display'] = 'none';

    var readyEl = document.querySelector('#ready');
    readyEl.style['display'] = 'block';
});