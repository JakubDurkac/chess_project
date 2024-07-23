import { announceCheckmate, flipBoard, isFlippedBoard, oppositeColor } from "./board.js";
import { sendJoinRequest } from "./client.js";
import { gameStats } from "./stats.js";

export let isOnlineMatch = false;
export let onlineYourColor = null;
export let onlineOpponentName = null;
export let onlineYourName = null;
export let onlineStartClockMillis = null;
export let onlineGameColorType = null;

const onlinePanelElem = document.querySelector('.js-online-panel');

export function updateClocks(whiteClockMillis, blackClockMillis) {
    const whiteClockElem = document.getElementById('white-clock');
    const blackClockElem = document.getElementById('black-clock');

    if (whiteClockElem) {
        console.log("oldTime: White: ", whiteClockElem.innerHTML);
        whiteClockElem.innerHTML = formatTime(whiteClockMillis >= 0
            ? whiteClockMillis
            : 0);
    }

    if (blackClockElem) {
        console.log("oldTime: Black: ", whiteClockElem.innerHTML);
        blackClockElem.innerHTML = formatTime(blackClockMillis >= 0
            ? blackClockMillis
            : 0);
    }

    if (whiteClockMillis <= 0) {
        console.log('Black won on time.');
        announceCheckmate(gameStats.kingCoords.black, gameStats.kingCoords.white);

    } else if (blackClockMillis <= 0) {
        announceCheckmate(gameStats.kingCoords.white, gameStats.kingCoords.black);
        console.log('White won on time.');
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

export function setOnlineAttributes(opponentName, yourColor, yourName, startClockMillis, gameColorType) {
    onlineOpponentName = opponentName;
    onlineYourColor = yourColor;
    onlineYourName = yourName;
    isOnlineMatch = true;
    onlineGameColorType = gameColorType;

    onlineStartClockMillis = startClockMillis;

    if ((yourColor === 'black' && !isFlippedBoard)
        || (yourColor === 'white' && isFlippedBoard)
    ) {
        flipBoard();
    }

    const opponentColor = oppositeColor(yourColor);
    createOnlineMatchHtml(yourName, yourColor, opponentName, opponentColor, startClockMillis);
}

function joinOnlineOpponent(yourName, nameToJoin) {
    sendJoinRequest(yourName, nameToJoin);
}

export function createOnlineMatchHtml(yourName, yourColor, opponentName, opponentColor, startClockMillis) {
    const yourScoreElem = document.querySelector(`.online-score-${yourColor}`);
    const opponentScoreElem = document.querySelector(`.online-score-${opponentColor}`);
    let yourScore = 0;
    let opponentScore = 0;

    if (yourScoreElem && opponentScoreElem) {
        if (onlineGameColorType === 'random') {
            yourScore = opponentScoreElem.innerText;
            opponentScore = yourScoreElem.innerText;

        } else {
            yourScore = yourScoreElem.innerText;
            opponentScore = opponentScoreElem.innerText;
        }
    }

    let matchHtml = `
    <div class="online-match-container js-online-match-container">
        <div class="online-opponent online-${opponentColor}">
            <div class="name-score">
                <p class="online-name">${opponentName}</p>
                <p class="online-score-${opponentColor}">${opponentScore}</p>
            </div>
            <div id="${opponentColor}-clock">${formatTime(startClockMillis)}</div>
        </div>
        <div class="online-player online-${yourColor}">
            <div id="${yourColor}-clock">${formatTime(startClockMillis)}</div>
            <div class="name-score">
                <p class="online-name">${yourName}</p>
                <p class="online-score-${yourColor}">${yourScore}</p>
            </div>
        </div>
    </div>`;

    onlinePanelElem.innerHTML = matchHtml;
}

function formatTimeControl(timeMillis, incrementMillis) {
    const timeMinutes = Math.round(timeMillis / 1000 / 60);
    const incrementSeconds = Math.round(incrementMillis / 1000);
    return `${timeMinutes}|${incrementSeconds}`;
}

function formatColor(color) {
    return color;
}

function generateClickableOpponent(name, settings) {
    console.log(settings);
    const {time, increment, color} = settings;
    return `
    <div class="opponent-to-join">
        <span>${name}</span>
        <span class="opponents-list-color-field">${formatColor(color)}</span>
        <span class="opponents-list-time-field">${formatTimeControl(time, increment)}</span>
        <button data-name-to-join="${name}" class="join-button">GO</button>
    </div>`
}

function generateOpponentsList(availableOpponents, yourName) {
    let opponentsListHtml = `
    <div class="opponent-to-join opponents-header">
        <span>Name</span>
        <span class="opponents-list-color-field">Color</span>
        <span class="opponents-list-time-field">Time</span>
        <span></span>
    </div>`;

    let opponentsCount = 0;
    availableOpponents.forEach((opponent) => {
        const {name, settings} = opponent;
        if (name !== yourName) {
            opponentsListHtml += generateClickableOpponent(name, settings);
            opponentsCount++;
        }
    });

    if (opponentsCount === 0) {
        opponentsListHtml += `
        <div class="no-opponents-online">
            <span>No players looking for a game</span>
        </div>`
    }

    return opponentsListHtml;
}

export function updateOnlineOpponentsHtml(availableOpponents, yourName) {
    if (isOnlineMatch) {
        return; // do not update when game is going on
    }

    const availableOpponentsHtml = `
    <div class="online-opponents-container js-online-opponents-container">
        ${generateOpponentsList(availableOpponents, yourName)}
    </div>`

    onlinePanelElem.innerHTML = availableOpponentsHtml;

    document.querySelectorAll('.join-button').forEach((joinButtonElem) => {
        console.log('Adding event listener');
        joinButtonElem.addEventListener('click', () => {
            joinOnlineOpponent(yourName, joinButtonElem.dataset.nameToJoin);
            console.log(yourName, joinButtonElem.dataset.nameToJoin);
        });
    });
}

export function goOffline() {
    isOnlineMatch = false;
    document.querySelector('.js-play-button').innerText = 'Restart Game';

    document.querySelector(".online-opponent").style.opacity = 0.6;
    document.querySelector(".online-player").style.opacity = 0.6;
}

export function resetOnlineAttributes() {
    onlineOpponentName = null;
    onlineYourColor = null;
}