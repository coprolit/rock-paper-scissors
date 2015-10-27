/**
 * Created by philippe_simpson on 01/10/15.
 */

"use strict";

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
    // socket represents a client / individual user
    //console.log(socket.id, "connected");
    var session; // reference to session object

    socket.on('create', function(){ // when client wants to create a new game
        if(session) { // we somehow already have a session stored
            socket.emit('message', 'Something went wrong. Try again.');
        } else {
            session = new sessionManager(); // store a reference to session object for future use
            session.addPlayer(socket); //createPlayer(socket, session);
            socket.emit('waiting', session.getId());
        }
    });

    socket.on('join', function(sessionID){ // when client wants to join an existing game
        if(session) { // we somehow already have a session stored
            socket.emit('message', 'Something went wrong. Try again.');
        } else {
            session = new sessionManager(sessionID); // getSession(parseInt(sessionID)); // store a reference to session object for future use

            if(session.getId() && session.joinable()){ // session exists and is neither empty nor full.
                session.addPlayer(socket); // Add joining client

                // start game for both clients:
                session.getPlayers().forEach(function(element){
                    element.socket.emit('start');
                });
            } else {
                session = null; // break reference to session object
                socket.emit('message', 'Invalid game.');
            }
        }
    });

    socket.on('disconnect', function () { // a client disconnected - reset game state
        if(session) {
            var otherPlayer = session.getPlayers().find(function(element) {
                return (element.socket.id !== socket.id);
            });
            if(otherPlayer) otherPlayer.socket.emit('restart'); // restart other player

            session.close();
        }
    });

    socket.on('choice', function (val) {
        setChoice(session, socket, val);
        socket.emit('choice:confirmed', val);

        var otherPlayer = session.getPlayers().find(function(element) {
            return (element.socket.id !== socket.id);
        });
        otherPlayer.socket.emit('choice:confirmed');
    });

    socket.on('restart:done', function() {
        session = null; // break reference to session object
    });
});

/**
 * Game Logic
 */
var sessions = []; // global lookup for active sessions
var sessionIDCounter = 0;

var sessionManager = function (id) { // module for managing individual sessions
    var session;

    if(id){ // join an existing session
        var index = sessions.findIndex(function(element){
            return (element.id === parseInt(id));
        });
        session = sessions[index];
    } else { // create a new session from scratch
        sessionIDCounter++;
        session = {
            id: sessionIDCounter,
            round: 0,
            players: []
        };
        sessions.push(session);
    }

    function close(){
        // remove session entry from sessions array
        var index = sessions.findIndex(function(element) {
            return (element.id === session.id);
        });
        if(index > -1){
            sessions.splice(index, 1);
        }

        session = null;
    }

    function joinable(){
        return session.players.length === 1; // a session is only joinable if exactly _one_ player is waiting.
    }

    function player( socket ) {
        var player = {
            weapon: null,
            wins: 0,
            socket: socket
        };

        session.players.push(player);
        return player;
    }

    function getAllPlayers(){
        return session.players;
    }

    function getSessionId(){
        return session ? session.id : false;
    }

    function round(){
        return session.round;
    }
    function incrementRound(){
        session.round = session.round + 1;
    }

    // Reveal public pointers to private functions and properties
    return {
        getId: getSessionId,
        close: close,
        addPlayer: player,
        getPlayers: getAllPlayers,
        joinable: joinable,
        getRound: round,
        incrementRound: incrementRound
    };
};

function setChoice(session, socket, val) {
    // find player, then assign weapon choice:
    var player = session.getPlayers().find(function(element) {
        //console.log("setChoice", element.socket.id, socket.id);
        return (element.socket.id === socket.id);
    });
    player.weapon = val;
    //console.log("setChoice()", socket,id, player.weapon);
    resolveDuel(session);
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

function resolveDuel(session) {
    // get both players
    var player1 = session.getPlayers()[0],
        player2 = session.getPlayers()[1];

    if (player1.weapon && player2.weapon) {
        var result = fight(player1, player2);

        if(result.winner){
            result.winner.wins = result.winner.wins +1;
        } // else tie

        session.incrementRound();

        session.getPlayers().forEach(function(element){
            // Try sending the object as a whole:
            var data = {
                round: session.getRound(),
                p1Id: player1.socket.id,
                p1Wins: player1.wins,
                p1Weapon: player1.weapon,
                p2Id: player2.socket.id,
                p2Wins: player2.wins,
                p2Weapon: player2.weapon,
                resultMessage: result.msg,
                winnerId: result.winner ? result.winner.socket.id : null
            };
            element.socket.emit('result', data /*player1, player2, result, session.round*/);
        });

        player1.weapon = player2.weapon = null; // reset weapon choices

        // wait and emit reset
        setTimeout(function() {
            reset(session);
        }, 8000)
    }
}

function reset(session){ // tell connected clients of session to reset UI for a new round
    session.getPlayers().forEach(function(element){
        element.socket.emit('reset');
    });
}