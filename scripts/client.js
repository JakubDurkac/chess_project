import { makeMoveWithExtra } from "./board.js";
import { resetGameLocally } from "./chess.js";
import { createOnlineMatchHtml, goOffline, setOnlineAttributes } from "./online.js";

let socket = null;
let yourName = null;
let isConnected = false;
export function findMatch() {
    if (isConnected) {
        return;
    }

    const inputNameElem = document.querySelector('.js-name-input');
    const inputName = inputNameElem.value;
    inputNameElem.value = '';

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

function sendInitialMessage() {
    console.log('Connected to the WebSocket server');

    const objMessage = {
        name: yourName
    };

    socket.send(JSON.stringify(objMessage));

    // should be set after player is joined matchmaking = server sent 'waiting' notification
    // this notification is yet to be implemented
    createOnlineMatchHtml(yourName, 'white', 'Finding a match...', 'black');
}

function handleIncomingMessage(event) {
    const strMessage = event.data.toString();
    const objMessage = JSON.parse(strMessage);
    console.log(strMessage);
    console.log(objMessage);

    if (objMessage.matchAttributes !== undefined) { // opponent found
        const {opponentName, yourColor} = objMessage.matchAttributes;
        
        setOnlineAttributes(opponentName, yourColor, yourName);
        resetGameLocally();
        // display attributes visually
    
    } else if (objMessage.move !== undefined) { // opponent's move played
        const {move} = objMessage;
        makeMoveWithExtra(move.fromCoords, move.toCoords);

    } else if (objMessage.notification !== undefined) {
        const {notification} = objMessage;
        if (notification === 'opponent disconnected') {
            // show message to the user
            disconnectFromServer();

        } else if (notification === 'duplicate') {
            // show message to the user 
            disconnectFromServer();
            

        } else if (notification === 'resign') {
            resetGameLocally();
        }
    }
}

export function sendMove(fromCoords, toCoords, name) {
    console.log(fromCoords, toCoords, name);
    const objMessage = {
        move: {
            'fromCoords': fromCoords,
            'toCoords': toCoords,
            'by': name
        }
    };

    socket.send(JSON.stringify(objMessage));
}
