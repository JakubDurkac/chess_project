const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const PORT_NUMBER = 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let playersSockets = {}; // {'name': theirSocket}
let matches = {}; // match ... 'name1': 'name2', 'name2': 'name1'
let activeNames = [];

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
            // test mock delay

            setTimeout(() => {
                playersSockets[matches[objMessage.move.by]].send(strMessage);
            }, 1000);
            
            // test ends here

            // playersSockets[matches[objMessage.move.by]].send(strMessage);
        
        } else if (objMessage.clockStartTimestamp !== undefined) {
            playersSockets[matches[objMessage.by]]
                .send(strMessage);

        } else if (objMessage.notification !== undefined) {
            const {message, by} = objMessage.notification;
            if (message === 'resign') {
                playersSockets[matches[by]].send(
                    JSON.stringify({notification: 'resign'})
                );
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