let socket = null;
let matchAttributes = null;

export function findMatch() {
    const inputName = document.querySelector('.js-name-input').value;
    if (inputName === '') {
        console.log('empty name');
        return;
    }

    socket = new WebSocket('ws://localhost:3000');
    socket.addEventListener('open', (inputName) => {
        sendInitialMessage(inputName);
    });

    socket.addEventListener('message', handleIncomingMessage);
}

function sendInitialMessage(inputName) {
    console.log('Connected to the WebSocket server');

    const objMessage = {
        name: inputName
    };

    socket.send(JSON.stringify(objMessage));
}

function handleIncomingMessage(event) {
    const strMessage = event.data.toString();
    const objMessage = JSON.parse(strMessage);

    // opponent disconnected
    // wrong name
    if (objMessage.matchAttributes !== undefined) { // opponent found
        matchAttributes = objMessage.matchAttributes;
        // set up your game based on the attributes
    
    } else { // opponent's move played
        const move = objMessage.move;
        // make that move here
    }
}

function sendMove(fromCoords, toCoords) {
    const objMessage = {
        move: {
            'fromCoords': fromCoords,
            'toCoords': toCoords
        }
    };

    socket.send(JSON.stringify(objMessage));
}
