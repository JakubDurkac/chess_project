import { makeMoveWithExtra, oppositeColor, updateScoreResignation } from "./board.js";
import { resetGameLocally } from "./chess.js";
import { updateOnlineOpponentsHtml, goOffline, setOnlineAttributes, updateClocks, onlineYourColor } from "./online.js";
import { gameStats } from "./stats.js";

let socket = null;
let yourName = null;
let isConnected = false;
export function findMatch() {
    if (isConnected) {
        return;
    }

    const inputNameElem = document.querySelector('.js-name-input');
    const inputName = inputNameElem.value;

    if (inputName === '') {
        console.log('empty name');
        return;
    }

    yourName = inputName;
    socket = new WebSocket('ws://localhost:3000');
    socket.addEventListener('open', sendInitialMessage);
    socket.addEventListener('message', handleIncomingMessage);

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
            // show message to the user
            updateScoreResignation(oppositeColor(onlineYourColor));
            disconnectFromServer();

        } else if (notification === 'duplicate') {
            // show message to the user 
            disconnectFromServer();
            

        } else if (notification === 'resign') {
            updateScoreResignation(oppositeColor(onlineYourColor));
            resetGameLocally();
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