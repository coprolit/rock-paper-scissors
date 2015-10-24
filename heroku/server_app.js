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
    //console.log("on connection", "socket.id", socket.id, sessions.length);
    // socket represents a client / individual user
    var sessionRef; // reference to session object in sessions array

    socket.on('start', function(){
        if(sessionRef) { // we somehow already have a session stored
            //console.log("on start", socket.id, "session id:", sessionRef.id);
            socket.emit('message', 'Something went wrong. Try again.');
        } else {
            sessionRef = createSession(); // store a reference to session object for future use
            createPlayer(socket, sessionRef);
            //console.log("on start", socket.id, "session id:", sessionRef.id);
            socket.emit('waiting', sessionRef.id);
            //console.log("on start waiting", socket.id, "session id:", sessionRef.id);
        }
    });

    socket.on('join', function(sessionID){
        //console.log("on join", socket.id, "session:", sessionID);
        if(sessionRef) { // we somehow already have a session stored
            socket.emit('message', 'Something went wrong. Try again.');
        } else {
            sessionRef = getSession(parseInt(sessionID)); // store a reference to session object for future use

            if(sessionRef && sessionRef.players.length === 1){
                createPlayer(socket, sessionRef);

                sessionRef.players.forEach(function(element){
                    element.socket.emit('start');
                });
            } else {
                sessionRef = null; // break reference to session object
                socket.emit('message', 'Invalid game.');
            }
        }
    });

    socket.on('disconnect', function () { // a client disconnected - reset game state
        //console.log("on disconnect", socket.id);
        if(sessionRef) {
            var otherPlayer = sessionRef.players.find(function(element) {
                return (element.socket.id !== socket.id);
            });
            if(otherPlayer) otherPlayer.socket.emit('restart'); // restart other player

            closeSession(sessionRef);
        }
    });

    socket.on('choice', function (val) {
        //console.log("on choice", socket.id, "session:", sessionRef.id, val);
        setChoice(sessionRef, socket, val);
        socket.emit('choice:confirmed', val);

        var otherPlayer = sessionRef.players.find(function(element) {
            //console.log("setChoice", element.socket.id, socket.id);
            return (element.socket.id !== socket.id);
        });
        otherPlayer.socket.emit('choice:confirmed');
    });

    socket.on('restart:done', function() {
        sessionRef = null; // break reference to session object
        //console.log("on restart done", sessions);
    });
});

/**
 * Game Logic
 */
var sessions = [];
var sessionIDCounter = 0;

function createSession(){
    sessionIDCounter++;
    var newSession = {
        id: sessionIDCounter,
        round: 0,
        players: []
    };
    sessions.push(newSession);
    console.log("session created", newSession.id);
    return sessions[sessions.length - 1];
}

function getSession(sessionID){
    // search for session ID in stored sessions
    var index = sessions.findIndex(function(element){
        //console.log("getSession() find", element.id, sessionID);
        return (element.id === sessionID);
    });
    return sessions[index];
}

function closeSession(session){
    // delete session and players of session
    var index = sessions.findIndex(function(element) {
        return (element.id === session.id);
    });

    if(index > -1){
        //console.log("closeSession() deleting session", sessions[index]);
        sessions.splice(index, 1);
    }
    //session = undefined; // break reference to object
    //console.log("done", sessions[index], session);
}

function createPlayer(socket, session){
    var player = {
        weapon: null,
        wins: 0,
        socket: socket
    };

    session.players.push(player);
    return player;
}

function setChoice(session, socket, val) {
    //console.log("setChoice", session, socket.id, val);
    // find player, then assign weapon choice:
    var player = session.players.find(function(element) {
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
    var player1 = session.players[0],
        player2 = session.players[1];

    if (player1.weapon && player2.weapon) {
        var result = fight(player1, player2);

        if(result.winner){
            result.winner.wins = result.winner.wins +1;
        } // else tie

        session.round = session.round + 1;

        session.players.forEach(function(element){
            // Try sending the object as a whole:
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
            element.socket.emit('result', data /*player1, player2, result, session.round*/);
        });

        player1.weapon = player2.weapon = null; // reset weapon choices

        // wait and emit reset
        setTimeout(function() {
            reset(session);
        }, 8000)
    }
}

function reset(session){ // tell connected clients to reset UI for a new round
    session.players.forEach(function(element){
        element.socket.emit('reset');
    });
    //io.emit('reset');
}