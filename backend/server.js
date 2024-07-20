const express = require('express');
const http = require('http');
const { send } = require('process');
const WebSocket = require('ws');

const PORT_NUMBER = 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let playersSockets = {}; // {'name': theirSocket}
let matches = {}; // match ... 'name1': 'name2', 'name2': 'name1'
let activeNames = [];
let games = {};

function createGame(whiteName, blackName, startClockMillis) {
    const game = {        
        moveStartTimestamp: null,
        whiteName: whiteName,
        blackName: blackName,
        duration: {
            initial: startClockMillis,
            white: startClockMillis,
            black: startClockMillis
        },
        increment: 0,
        whiteClock: startClockMillis,
        blackClock: startClockMillis,
        isWhiteTurn: true,
        intervalId: null
    };

    games[whiteName] = game;
    games[blackName] = game;

    return game;
}

function sendClockUpdate(game) {
    const clockUpdateMessageStr = JSON.stringify({clockUpdate:{
        white: game.whiteClock,
        black: game.blackClock
    }});

    if (playersSockets[game.whiteName] !== undefined
        && playersSockets[game.blackName] !== undefined
    ) {
        playersSockets[game.whiteName].send(clockUpdateMessageStr);
        playersSockets[game.blackName].send(clockUpdateMessageStr);
    }
}

wss.on('connection', (ws) => {
    console.log(`A new client connected`);
    ws.on('message', (message) => {     
        const strMessage = message.toString();
        const objMessage = JSON.parse(strMessage);
        console.log(strMessage);
    
        if (objMessage.name !== undefined) {
            const name = objMessage.name;
            if (activeNames.includes(name)) {
                console.log(`Client name is taken.`);
                ws.send(JSON.stringify({notification: 'duplicate'}));
                return;
            }

            for (let i = 0; i < activeNames.length; i++) {
                const opponentName = activeNames[i];
                if (matches[opponentName] === undefined) {
                    matches[opponentName] = name;
                    matches[name] = opponentName;

                    const randomNumber = Math.random();
                    const color = randomNumber < 1 / 2 ? 'white' : 'black';

                    const whiteName = color === 'white' ? opponentName : name;
                    const blackName = color === 'white' ? name : opponentName;

                    const game = createGame(whiteName, blackName, 3 * 60 * 1000);

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
            activeNames.push(name);

            console.log('Matches:');
            console.log(matches);
    
        } else if (objMessage.move !== undefined) {
            const {move} = objMessage;
            const game = games[move.by];
            game.isWhiteTurn = !game.isWhiteTurn;
            if (move.isFirst) {
                game.moveStartTimestamp = new Date().getTime();
                game.intervalId = setInterval(() => {
                    if (game.isWhiteTurn) {
                        game.whiteClock = game.duration.white - (new Date().getTime() - game.moveStartTimestamp);
                    } else {
                        game.blackClock = game.duration.black - (new Date().getTime() - game.moveStartTimestamp);
                    }

                    if (game.whiteClock <= 0 || game.blackClock <= 0) {
                        clearInterval(game.intervalId);
                        // someone lost on time, clients should be notified, also last clock update
                        return;
                    }

                    sendClockUpdate(game);

                    console.log(`Clock: White: ${game.whiteClock / 1000} sec, Black: ${game.blackClock / 1000} sec`);
                }, 500);
            }

            game.moveStartTimestamp = new Date().getTime();
            game.duration.white = game.whiteClock;
            game.duration.black = game.blackClock;
            playersSockets[matches[move.by]].send(strMessage);
        
        } else if (objMessage.clockStartTimestamp !== undefined) {
            playersSockets[matches[objMessage.by]]
                .send(strMessage);

        } else if (objMessage.notification !== undefined) {
            const {message, by} = objMessage.notification;
            if (message === 'resign') {
                const game = games[by];
                clearInterval(game.intervalId);

                playersSockets[matches[by]].send(
                    JSON.stringify({notification: 'resign'})
                );

                const newGame = createGame(game.whiteName, game.blackName, game.duration.initial);
                sendClockUpdate(newGame);
            }
        }
    });

    ws.on('close', () => {
        let disconnectedName = '';
        for (let i = 0; i < activeNames.length; i++) {
            const name = activeNames[i];
            if (playersSockets[name] === ws) {
                disconnectedName = name;
                const opponent = matches[name];
                if (playersSockets[opponent] !== undefined) {
                    console.log(`Sending "opponent disconnected" to <${opponent}>.`);
                    playersSockets[opponent].send(
                        JSON.stringify({notification: 'opponent disconnected'}));
                }

                if (games[name]) {
                    clearInterval(games[name].intervalId);
                    delete games[name];
                }
                
                delete playersSockets[name];
                delete matches[name];
                removeName(name);

                break;
            }
        }

        console.log(`Client <${disconnectedName}> disconnected.`);
        console.log('Matches:');
        console.log(matches);
        console.log('Active Players:');
        for (const name in playersSockets) {
            console.log(name);
        }
    });
});

function removeName(name) {
    const indexToRemove = activeNames.indexOf(name);
    if (indexToRemove >= 0) {
        activeNames.splice(indexToRemove, 1);
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