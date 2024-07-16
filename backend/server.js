const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const PORT_NUMBER = 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let playersSockets = {}; // {'name': theirSocket}
let matches = {}; // match ... 'name1': 'name2', 'name2': 'name1'

wss.on('connection', (ws) => {
    console.log(`A new client connected`);
    const socket = ws;
    ws.on('message', (message) => {     
        const strMessage = message.toString();
        const objMessage = JSON.parse(strMessage);
        console.log(strMessage);
    
        if (objMessage.name !== undefined) {
            const name = objMessage.name;
            if (playersSockets[name] !== undefined) {
                ws.send(JSON.stringify({notification: 'duplicate'}));
                return;
            }
    
            for (const opponentName in playersSockets) {
                if (matches[opponentName] === undefined) {
                    matches[opponentName] = name;
                    matches[name] = opponentName;
    
                    
                    const randomNumber = Math.random();
                    const color = randomNumber < 1 / 2 ? 'white' : 'black';
                    ws.send(JSON.stringify({matchAttributes: {
                        'opponentName': opponentName,
                        'yourColor': color
                    }}));
                    playersSockets[opponentName].send(JSON.stringify({matchAttributes: {
                        'opponentName': name,
                        'yourColor': color === 'white' ? 'black' : 'white'
                    }}));
                    
                    break;
                }
            }
    
            playersSockets[name] = ws;
    
        } else if (objMessage.move !== undefined) {
            console.log(objMessage.move.by);
            console.log(matches[objMessage.move.by]);
            console.log(playersSockets[matches[objMessage.move.by]]);
            playersSockets[matches[objMessage.move.by]].send(strMessage);
        } });

    ws.on('close', (clientName) => { handleClientDisconnect(clientName) });
});

function handleClientDisconnect() {
    console.log(`Client ${clientName} disconnected.`);
    //removePlayer(clientName);
    // We need to notify his match opponent and terminate that game.
}

function findPlayerIndex(playerName) {
    for (let i = 0; i < players.length; i++) {
        if (players[i].name === playerName) {
            return i;
        }
    }

    return -1;
}

function removePlayer(playerName) {
    const toRemoveIndex = findPlayerIndex(playerName);
    if (toRemoveIndex !== -1) {
        players.splice(toRemoveIndex, 1);
    }
}

const PORT = process.env.PORT || PORT_NUMBER;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const shutdown = () => {
    console.log('Shutting down server...');
    wss.close(() => {
        console.log('WebSocket server closed');
        server.close(() => {
            console.log('HTTP server closed');
            process.exit(0);
        });
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);