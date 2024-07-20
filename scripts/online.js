import { flipBoard, isFlippedBoard } from "./board.js";

export let isOnlineMatch = false;
export let onlineYourColor = null;
let onlineOpponentName = null;
export let onlineYourName = null;
let onlineStartClockMillis = null;

const onlineMatchContainerElem = document.querySelector('.js-online-match-container');

export function updateClocks(whiteClockMillis, blackClockMillis) {
    const whiteClockElem = document.getElementById('white-clock');
    const blackClockElem = document.getElementById('black-clock');

    if (whiteClockElem) {
        console.log("oldTime: White: ", whiteClockElem.innerHTML);
        whiteClockElem.innerHTML = formatTime(whiteClockMillis);
    }

    if (blackClockElem) {
        console.log("oldTime: Black: ", whiteClockElem.innerHTML);
        blackClockElem.innerHTML = formatTime(blackClockMillis);
    }
    
    console.log("newTime: White: ", whiteClockElem.innerHTML);
    console.log("newTime: Black: ", blackClockElem.innerHTML);
}

function formatTime(milliseconds) {
    let minutes, seconds, total_hours, total_minutes, total_seconds;
    total_seconds = parseInt(Math.floor(milliseconds / 1000));
    total_minutes = parseInt(Math.floor(total_seconds / 60));
    total_hours = parseInt(Math.floor(total_minutes / 60));
  
    seconds = parseInt(total_seconds % 60);
    minutes = parseInt(total_minutes % 60);

    const paddedSeconds = String(seconds).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0')

    return total_hours > 0 
        ? `${total_hours}:${paddedMinutes}:${paddedSeconds}`
        : `${minutes}:${paddedSeconds}`;
}

export function setOnlineAttributes(opponentName, yourColor, yourName, startClockMillis) {
    onlineOpponentName = opponentName;
    onlineYourColor = yourColor;
    onlineYourName = yourName;
    isOnlineMatch = true;

    onlineStartClockMillis = startClockMillis;

    if ((yourColor === 'black' && !isFlippedBoard)
        || (yourColor === 'white' && isFlippedBoard)
    ) {
        flipBoard();
    }

    const opponentColor = yourColor === 'white' ? 'black' : 'white';
    createOnlineMatchHtml(yourName, yourColor, opponentName, opponentColor, startClockMillis);
}

export function createOnlineMatchHtml(yourName, yourColor, opponentName, opponentColor, startClockMillis) {
    const opponentHtml = `
    <div class="online-opponent online-${opponentColor}">
        <div class="name-score">
            <p class="online-name">${opponentName}</p>
            <p class="online-score-${opponentColor}">0</p>
        </div>
        <div id="${opponentColor}-clock">${formatTime(startClockMillis)}</div>
    </div>`;
    const playerHtml = `
    <div class="online-player online-${yourColor}">
        <div id="${yourColor}-clock">${formatTime(startClockMillis)}</div>
        <div class="name-score">
            <p class="online-name">${yourName}</p>
            <p class="online-score-${yourColor}">0</p>
        </div>
    </div>`;

    onlineMatchContainerElem.innerHTML = opponentHtml + playerHtml;
}

export function goOffline() {
    isOnlineMatch = false;
    document.querySelector('.js-play-button').innerText = 'Restart Game';

    onlineMatchContainerElem.innerHTML = '';
}

export function resetOnlineAttributes() {
    onlineOpponentName = null;
    onlineYourColor = null;
}