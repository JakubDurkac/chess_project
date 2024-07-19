import { flipBoard, isFlippedBoard } from "./board.js";

export let isOnlineMatch = false;
export let onlineYourColor = null;
let onlineOpponentName = null;
export let onlineYourName = null;

const clockIntervalIds = {
    white: null,
    black: null
}

const onlineMatchContainerElem = document.querySelector('.js-online-match-container');

export function runClock(color) {
    // stop other colored clock, run this clock
    const oppositeColor = color === 'white' ? 'black' : 'white';
    clearInterval(clockIntervalIds[oppositeColor]);

    const clockElem = document.getElementById(`${color}-clock`);
    clockIntervalIds[color] = setInterval(() => {
        const newTime = decrementTime(clockElem.innerHTML);

        if (newTime === 'stop') {
            clearInterval(clockIntervalIds[color]);
            // message the players
            return;
        }

        clockElem.innerHTML = newTime;
    }, 1000);
}

function decrementTime(time) {
    // time format 'min:sec'
    const values = time.split(':');
    let i = values.length - 1;
    while (i >= 0 && Number(values[i]) - 1 < 0) {
        values[i] = 59;
        i--;
    }

    if (i < 0) {
        return 'stop';
    }

    const decrementedValue = String(Number(values[i]) - 1);
    values[i] = i === values.length - 1 // seconds 
        ? decrementedValue.padStart(2, '0')
        : decrementedValue;

    return values.join(':');
}

function stopClocks() {
    clearInterval(clockIntervalIds['white']);
    clearInterval(clockIntervalIds['black']);
}

export function setOnlineAttributes(opponentName, yourColor, yourName) {
    onlineOpponentName = opponentName;
    onlineYourColor = yourColor;
    onlineYourName = yourName;
    isOnlineMatch = true;

    if ((yourColor === 'black' && !isFlippedBoard)
        || (yourColor === 'white' && isFlippedBoard)
    ) {
        flipBoard();
    }

    const opponentColor = yourColor === 'white' ? 'black' : 'white';
    createOnlineMatchHtml(yourName, yourColor, opponentName, opponentColor);
}

export function createOnlineMatchHtml(yourName, yourColor, opponentName, opponentColor) {
    const opponentHtml = `<div class="online-opponent online-${opponentColor}"><div class="name-score"><p class="online-name">${opponentName}</p><p class="online-score-${opponentColor}">0</p></div><div id="${opponentColor}-clock">5:00</div></div>`;
    const playerHtml = `<div class="online-player online-${yourColor}"><div id="${yourColor}-clock">5:00</div><div class="name-score"><p class="online-name">${yourName}</p><p class="online-score-${yourColor}">0</p></div></div>`;

    onlineMatchContainerElem.innerHTML = opponentHtml + playerHtml;
}

export function goOffline() {
    isOnlineMatch = false;
    document.querySelector('.js-play-button').innerText = 'Restart Game';

    stopClocks();
    onlineMatchContainerElem.innerHTML = '';
}

export function resetOnlineAttributes() {
    onlineOpponentName = null;
    onlineYourColor = null;
}