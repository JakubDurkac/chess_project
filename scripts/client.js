import { announceStalemate, makeMoveWithExtra, oppositeColor, updateScoreResignation } from "./board.js";
import { resetGameLocally } from "./chess.js";
import { updateOnlineOpponentsHtml, goOffline, setOnlineAttributes, updateClocks, onlineYourColor, addLogMessage, displayDrawOffer } from "./online.js";
import { gameStats, hasGameEnded } from "./stats.js";

let socket = null;
let yourName = null;
let isConnected = false;
let canOfferDraw = true;

export function setCanOfferDraw(isEnabled) {
    canOfferDraw = isEnabled;
}

export function findMatch() {
    if (isConnected) {
        addLogMessage("Already online.");
        return;
    }

    const inputNameElem = document.querySelector('.js-name-input');
    const inputName = inputNameElem.value;

    if (inputName === '') {
        console.log('empty name');
        addLogMessage('Enter your name.');
        return;
    }

    yourName = inputName;
    socket = new WebSocket('ws://localhost:3000');
    socket.addEventListener('open', sendInitialMessage);
    socket.addEventListener('message', handleIncomingMessage);
    socket.addEventListener('error', () => {
        addLogMessage('Error: Server is not available.');
    });

    isConnected = true;
}

export function disconnectFromServer() {
    if (socket !== null) {
        goOffline();
        socket.close();
        socket = null;
        isConnected = false;
    }
}

export function resignOnlineGame() {
    const objMessage = {
        notification: {
            message: 'resign',
            by: yourName
        }
    };

    socket.send(JSON.stringify(objMessage));
}

function getSelectedTimeMinutes() {
    return Number(document.getElementById("game-length").value);
}

function getSelectedIncrementSeconds() {
    return Number(document.getElementById("game-increment").value);
}

function getSelectedColor() {
    return document.getElementById("game-color").value;
}

function sendInitialMessage() {
    console.log('Connected to the WebSocket server');

    // time and increment should be read out from settings inputs in the future
    const objMessage = {
        name: yourName,
        settings: {
            time: getSelectedTimeMinutes() * 60 * 1000,
            increment: getSelectedIncrementSeconds() * 1000,
            color: getSelectedColor()
        }
    };

    socket.send(JSON.stringify(objMessage));
}

function handleIncomingMessage(event) {
    const strMessage = event.data.toString();
    const objMessage = JSON.parse(strMessage);
    console.log(strMessage);
    console.log(objMessage);

    if (objMessage.matchAttributes !== undefined) { // opponent found
        const {opponentName, yourColor, time, gameColorType} = objMessage.matchAttributes;
        
        addLogMessage("Match found.");
        setOnlineAttributes(opponentName, yourColor, yourName, time, gameColorType);
        resetGameLocally();
    
    } else if (objMessage.move !== undefined) { // opponent's move played
        const {move} = objMessage;
        makeMoveWithExtra(move.fromCoords, move.toCoords);

    } else if (objMessage.clockUpdate !== undefined) { // server clock times
        const {clockUpdate} = objMessage;
        console.log(clockUpdate);
        updateClocks(clockUpdate.white, clockUpdate.black);

    } else if (objMessage.availableOpponents !== undefined) {
        console.log('Server updates opponents list');
        updateOnlineOpponentsHtml(objMessage.availableOpponents, yourName);

    } else if (objMessage.notification !== undefined) {
        const {notification} = objMessage;
        if (notification === 'opponent disconnected') {
            addLogMessage("Opponent left. Entered singleplayer.")
            updateScoreResignation(oppositeColor(onlineYourColor));
            disconnectFromServer();

        } else if (notification === 'duplicate') {
            addLogMessage("Name is already taken. Try another!")
            disconnectFromServer();

        } else if (notification === 'resign') {
            if (gameStats.moveCount > 2 && !hasGameEnded()) {
                addLogMessage("Opponent resigned. Game restarts.");
            } else {
                addLogMessage("Opponent restarted the game.");
            }

            updateScoreResignation(oppositeColor(onlineYourColor));
            resetGameLocally();

        } else if (notification.drawOfferOnMove !== undefined) {
            displayDrawOffer(notification.drawOfferOnMove);
        
        } else if (notification === 'draw accepted') {
            addLogMessage("Opponent accepted the draw.");
            announceStalemate(gameStats.kingCoords.white, gameStats.kingCoords.black);
            
        } else if (notification === 'draw declined') {
            addLogMessage("Opponent declined the draw.");
            canOfferDraw = true;
        }
    }
}

export function sendMove(fromCoords, toCoords) {
    console.log(fromCoords, toCoords);
    const objMessage = {
        move: {
            'fromCoords': fromCoords,
            'toCoords': toCoords,
            'by': yourName,
            'isFirst': gameStats.moveCount === 0
        }
    };

    socket.send(JSON.stringify(objMessage));
}

export function sendJoinRequest(yourName, nameToJoin) {
    const objMessage = {
        joinRequest: {
            'nameToJoin': nameToJoin,
            'by': yourName
        }
    };

    socket.send(JSON.stringify(objMessage));
}

export function notifyServerGameEnded() {
    const objMessage = {
        notification: {
            message: 'game ended',
            by: yourName
        }
    };

    socket.send(JSON.stringify(objMessage));
}

export function sendDrawOffer() {
    if (hasGameEnded()) {
        addLogMessage('No draw offers now.');
        return;
    }

    if (!canOfferDraw) {
        addLogMessage('Draw offer pending.');
        return;
    }

    canOfferDraw = false;
    const objMessage = {
        notification: {
            message: 'draw offer',
            by: yourName,
            moveCount: gameStats.moveCount
        }
    };

    socket.send(JSON.stringify(objMessage));
}

export function sendDrawAccepted() {
    const objMessage = {
        notification: {
            message: 'draw accepted',
            by: yourName,
        }
    };

    socket.send(JSON.stringify(objMessage));
}

export function sendDrawDeclined() {
    const objMessage = {
        notification: {
            message: 'draw declined',
            by: yourName,
        }
    };

    socket.send(JSON.stringify(objMessage));
}