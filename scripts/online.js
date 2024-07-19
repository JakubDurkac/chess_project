import { flipBoard, isFlippedBoard } from "./board.js";

export let isOnlineMatch = false;
export let onlineYourColor = null;
let onlineOpponentName = null;
export let onlineYourName = null;

const INTERVAL_LENGTH = 1000; // ms
const clockIntervalIds = {
    white: null,
    black: null
}

const currentClockMillis = {
    white: 5 * 60 * 1000, // 5 min default
    black: 5 * 60 * 1000
}

const onlineMatchContainerElem = document.querySelector('.js-online-match-container');

export function runClock(color) {
    // stop other colored clock, run this clock
    const oppositeColor = color === 'white' ? 'black' : 'white';
    clearInterval(clockIntervalIds[oppositeColor]);

    const clockElem = document.getElementById(`${color}-clock`);
    clockIntervalIds[color] = setInterval(() => {
        currentClockMillis[color] = currentClockMillis[color] - INTERVAL_LENGTH;

        if (currentClockMillis[color] <= 0) {
            clearInterval(clockIntervalIds[color]);
            // message the players, player with <color> flagged
            return;
        }

        clockElem.innerHTML = formatTime(currentClockMillis[color]);
    }, INTERVAL_LENGTH);
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

function stopClocks() {
    clearInterval(clockIntervalIds['white']);
    clearInterval(clockIntervalIds['black']);
}

export function setOnlineAttributes(opponentName, yourColor, yourName, startClockMillis) {
    onlineOpponentName = opponentName;
    onlineYourColor = yourColor;
    onlineYourName = yourName;
    isOnlineMatch = true;

    currentClockMillis.white = startClockMillis;
    currentClockMillis.black = startClockMillis;
    clockIntervalIds.white = null;
    clockIntervalIds.black = null;

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

    stopClocks();
    onlineMatchContainerElem.innerHTML = '';
}

export function resetOnlineAttributes() {
    onlineOpponentName = null;
    onlineYourColor = null;
}