import { announceStalemate, getPlayerPromotionPieceCode, makeMoveWithExtra, oppositeColor, setOpponentPromotionPieceCode, updateScoreResignation } from "./board.js";
import { resetGameLocally } from "./chess.js";
import { updateOnlineOpponentsHtml, goOffline, setOnlineAttributes, updateClocks, onlineYourColor, addLogMessage, displayDrawOffer, isOnlineMatch } from "./online.js";
import { gameStats, hasGameEnded } from "./stats.js";

let socket = null;
let yourName = null;
let isConnected = false;
let canOfferDraw = true;

const allowedNamePattern = /^[a-zA-Z0-9_-]+$/;

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
        addLogMessage('Enter your name.');
        return;
    }

    if (inputName.length > 11) {
        addLogMessage('Name is too long. (> 11)');
        return;
    }

    if (!allowedNamePattern.test(inputName)) {
        addLogMessage('Invalid name. Use english letters, numbers, underscore and dash.');
        return;
    }

    yourName = inputName;
    // socket = new WebSocket('ws://localhost:3000');
    socket = new WebSocket('wss://chess-project-backend-jakubdurkac.onrender.com');
    socket.addEventListener('open', sendInitialMessage);
    socket.addEventListener('message', handleIncomingMessage);
    socket.addEventListener('error', () => {
        addLogMessage('Error: Server is not available.');
    });
    socket.addEventListener('close', () => {
        goOffline();
        socket = null;
        isConnected = false;
    });
}

export function disconnectFromServer() {
    if (isConnected && socket !== null) {
        socket.close();
        addLogMessage(`You disconnected.`);
    } else {
        addLogMessage(`Already offline.`);
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
    isConnected = true;

    const strMessage = event.data.toString();
    const objMessage = JSON.parse(strMessage);

    if (objMessage.matchAttributes !== undefined) { // opponent found
        const {opponentName, yourColor, time, gameColorType} = objMessage.matchAttributes;
        
        addLogMessage("Match found.");
        setOnlineAttributes(opponentName, yourColor, yourName, time, gameColorType);
        resetGameLocally();
    
    } else if (objMessage.move !== undefined) { // opponent's move played
        const {move} = objMessage;
        setOpponentPromotionPieceCode(move.promotionPieceCode);
        makeMoveWithExtra(move.fromCoords, move.toCoords);

    } else if (objMessage.clockUpdate !== undefined) { // server clock times
        const {clockUpdate} = objMessage;
        updateClocks(clockUpdate.white, clockUpdate.black);

    } else if (objMessage.availableOpponents !== undefined) {
        updateOnlineOpponentsHtml(objMessage.availableOpponents, yourName);

    } else if (objMessage.chat !== undefined) {
        addLogMessage(`${objMessage.by}: ${objMessage.chat}`);

    } else if (objMessage.notification !== undefined) {
        const {notification} = objMessage;
        if (notification === 'opponent disconnected') {
            addLogMessage("Opponent disconnected.")
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
    const objMessage = {
        move: {
            'fromCoords': fromCoords,
            'toCoords': toCoords,
            'by': yourName,
            'isFirst': gameStats.moveCount === 0,
            'promotionPieceCode': getPlayerPromotionPieceCode()
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

export function sendChatMessage() {
    const chatInputElem = document.querySelector('.js-chat-input');
    if (!chatInputElem || chatInputElem.value === '') {
        return;
    }

    const chatMessage = chatInputElem.value;
    chatInputElem.value = '';

    const objMessage = {
        notification: {
            message: 'chat',
            by: yourName,
            chatContent: chatMessage
        }
    };

    addLogMessage(`${yourName ?? 'Guest'}: ${chatMessage}`);

    if (socket === null || !isOnlineMatch) {
        return;
    }

    socket.send(JSON.stringify(objMessage));
}