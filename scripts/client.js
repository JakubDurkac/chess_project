import { setOnlineAttributes, makeMoveWithExtra } from "./board.js";
import { resetGameCompletely } from "./chess.js";

let socket = null;
let yourName = null;
export function findMatch() {
    const inputName = document.querySelector('.js-name-input').value;
    if (inputName === '') {
        console.log('empty name');
        return;
    }

    yourName = inputName;
    socket = new WebSocket('ws://localhost:3000');
    socket.addEventListener('open', sendInitialMessage);
    socket.addEventListener('message', handleIncomingMessage);
}

function sendInitialMessage() {
    console.log('Connected to the WebSocket server');

    const objMessage = {
        name: yourName
    };

    socket.send(JSON.stringify(objMessage));
}

function handleIncomingMessage(event) {
    const strMessage = event.data.toString();
    const objMessage = JSON.parse(strMessage);
    console.log(strMessage);
    console.log(objMessage);

    // opponent disconnected
    // wrong name
    if (objMessage.matchAttributes !== undefined) { // opponent found
        const {opponentName, yourColor} = objMessage.matchAttributes;
        resetGameCompletely();
        setOnlineAttributes(opponentName, yourColor, yourName);
    
    } else if (objMessage.move !== undefined) { // opponent's move played
        const move = objMessage.move;
        makeMoveWithExtra(move.fromCoords, move.toCoords);
        // make that move here
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
