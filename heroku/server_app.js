/**
 * Created by philippe_simpson on 01/10/15.
 */
/**
 * Module dependencies.
 */
var http = require('http');
var debug = require('debug')('rock-paper-scissors:server');

// Define a port we want to listen to
const PORT = process.env.PORT || 8080;

// We need a function which handles requests and send response
function handleRequest(request, response){
    response.end('It Works!! Path Hit: ' + request.url);
}

/**
 * Create HTTP server.
 */
var server = http.createServer(handleRequest);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});
server.on('error', onError);
server.on('listening', onListening);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

/**
 * Initialize an instance of socket.io by passing the HTTP server object
 */
var io = require('socket.io')(server);

io.on('connection', function (socket) {
    //console.log("connection", socket.id);
    // socket represents a client (= an individual user)

    socket.on('start', function(){
        var name = registerPlayer(socket.id);

        if(name){ // player was successfully registered
            //socket.broadcast.emit('result', name + ' connected'); // broadcast to other users
            //socket.emit('result', 'choose your weapon ' + name);

            socket.on('disconnect', function () {
                socket.broadcast.emit('mandown'); // broadcast to other users
                unregisterPlayer(socket.id);
            });

            socket.on('choice', function (val) {
                setChoice(socket.id, val);
                socket.emit('choice:confirmed', val);
                socket.broadcast.emit('choice:confirmed'); // broadcast to opponent
            });

            socket.emit('waiting', name);

        } else {
            socket.emit('message', 'Sorry, game is already full.');
        }
    });
});

/**
 * Game Logic
 */
/*
 var players = [
 {
 name: "Player 1",
 id: null,
 weapon: null
 },
 {
 name: "Player 2",
 id: null,
 weapon: null
 }];
 */
var player1 = {
    name: "PlayerA",
    id: null,
    weapon: null,
    wins: 0
};
var player2 = {
    name: "PlayerB",
    id: null,
    weapon: null,
    wins: 0
};

var players = [player1, player2];

var round = 0;

Object.observe(player1, function (changes) {
    if (changes[0].name === 'weapon') resolveDuel();
    if (changes[0].name === 'id') onRegistered();
});
Object.observe(player2, function (changes) {
    if (changes[0].name === 'weapon') resolveDuel();
    if (changes[0].name === 'id') onRegistered();
});

function onRegistered(){
    if(player1.id && player2.id) io.emit('start');
}
function registerPlayer(id) {
    var name;
    // abuse arr.some() because it's more compact than a for() loop:
    players.some(function(element){ // tests whether some element in the array passes the test
        if(element.id === null){
            element.id = id;
            name = element.name;
            return true; // passed the test
        }
    }); // arr.some() breaks the loop and returns true if callback function returns true - but we have no use for it...
    return name;
}
function unregisterPlayer(id) {
    // abuse arr.some() because it's more compact than a for() loop:
    players.some(function(element){ // tests whether some element in the array passes the test
        if(element.id === id){
            element.id = null;
            //element.wins = 0;
            //element.name = null;
            return true; // passed the test, break out of the loop
        }
    }); // arr.some() returns true if callback function returns true - but we have no use for it...

    player1.wins = player2.wins = 0;
    round = 0;
}

function setChoice(id, val) {
    // find player, then assign weapon choice:
    players.forEach(function(element){
        if(element.id === id) element.weapon = val;
    });
}
function fight(player1, player2){
    var weapon1 = player1.weapon,
        weapon2 = player2.weapon;

    if(weapon1 === weapon2) return {msg: "Tie"};

    // return result:

    if(weapon1 === "rock"){
        if(weapon2 === "paper"){
            return {winner: player2, looser: player1, msg: "paper beats rock"};
        }
        if(weapon2 === "scissors"){
            return {winner: player1, looser: player2, msg: "rock beats scissors"};
        }
    }

    if(weapon1 === "paper"){
        if(weapon2 === "rock"){
            return {winner: player1, looser: player2, msg: "paper beats rock"};
        }
        if(weapon2 === "scissors"){
            return {winner: player2, looser: player1, msg: "scissors beats paper"};
        }
    }

    if(weapon1 === "scissors"){
        if(weapon2 === "rock"){
            return {winner: player2, looser: player1, msg: "rock beats scissors"};
        }
        if(weapon2 === "paper"){
            return {winner: player1, looser: player2, msg: "scissors beats paper"};
        }
    }
}

function resolveDuel() {
    if (player1.weapon && player2.weapon) {
        var result = fight(player1, player2);

        if(result.winner){
            result.winner.wins = result.winner.wins +1;
        } // else tie

        //io.emit('result', result);

        round = round + 1;
        io.emit('score', player1, player2, round);

        player1.weapon = player2.weapon = null; // reset weapon choices
    }
}