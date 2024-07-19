import { flipBoard, isFlippedBoard } from "./board.js";

export let isOnlineMatch = false;
export let onlineYourColor = null;
let onlineOpponentName = null;
export let onlineYourName = null;

const INTERVAL_LENGTH = 50; // ms
const clockInterval = {
    white: null,
    black: null
}

const currentClockMillis = {
    white: 5 * 60 * 1000, // 5 min default
    black: 5 * 60 * 1000
}

const onlineMatchContainerElem = document.querySelector('.js-online-match-container');

export function runClock(color, delay) {
    // stop other colored clock, run this clock
    const opponentColor = color === 'white' ? 'black' : 'white';
    if (clockInterval[opponentColor] !== null) { // moveCount > 1
        currentClockMillis[opponentColor] += delay;    
    }

    clearClockInterval(opponentColor);
    currentClockMillis[color] -= delay;

    const clockElem = document.getElementById(`${color}-clock`);
    clockInterval[color] = setClockInterval(() => {
        currentClockMillis[color] -= INTERVAL_LENGTH;

        if (currentClockMillis[color] <= 0) {
            clearClockInterval(color);
            // message the players, player with <color> flagged
            return;
        }

        clockElem.innerHTML = formatTime(currentClockMillis[color]);
    }, INTERVAL_LENGTH);
}

function setClockInterval(callback, interval) {
    // regular setInterval goes to sleep when window is inactive
    var worker = new Worker('./scripts/worker.js');
    var lastTime = new Date().getTime();

    worker.onmessage = function() {
        var currentTime = new Date().getTime();
        if (currentTime - lastTime >= interval) {
            callback();
            lastTime = currentTime;
        }
    };

    return {
        clear: function() {
            worker.terminate();
        }
    };
}

function clearClockInterval(color) {
    if (clockInterval[color] !== null) {
        clockInterval[color].clear();
        clockInterval[color] = null;
    }
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
    clearInterval(clockInterval['white']);
    clearInterval(clockInterval['black']);
}

export function setOnlineAttributes(opponentName, yourColor, yourName, startClockMillis) {
    onlineOpponentName = opponentName;
    onlineYourColor = yourColor;
    onlineYourName = yourName;
    isOnlineMatch = true;

    currentClockMillis.white = startClockMillis;
    currentClockMillis.black = startClockMillis;
    clockInterval.white = null;
    clockInterval.black = null;

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