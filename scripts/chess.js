import { initializeBoard, updateBoardPieces, notationElem, resetBoard, flipBoard, updateScoreResignation, oppositeColor } from "./board.js";
import { findMatch, disconnectFromServer, resignOnlineGame } from "./client.js";
import { resetGameStats } from "./stats.js";
import { isOnlineMatch, onlineGameColorType, onlineOpponentName, onlineStartClockMillis, onlineYourColor, onlineYourName, setOnlineAttributes } from "./online.js"

setUpModalSettings();
initializeBoard();
export let isPlaying = false;

document.querySelector('.online-panel').innerHTML = getWelcomeMessage();
notationElem.innerHTML = getInitialNotationMessage();

const playButtonElem = document.querySelector('.js-play-button');
const findMatchButtonElem = document.querySelector('.js-find-match-button');
const disconectButtonElem = document.querySelector('.js-disconnect-button');
const flipBoardButtonElem = document.querySelector('.js-flip-button');
playButtonElem.addEventListener('click', resetGameCompletely);
findMatchButtonElem.addEventListener('click', findMatch);
disconectButtonElem.addEventListener('click', () => {
    updateScoreResignation(onlineYourColor);
    disconnectFromServer();
});
flipBoardButtonElem.addEventListener('click', flipBoard);

export function resetGameCompletely() {
    if (isOnlineMatch) {
        resignOnlineGame();
        updateScoreResignation(onlineYourColor);
    }

    resetGameLocally();
}

export function resetGameLocally() {
    if (isOnlineMatch && onlineGameColorType === 'random') {
        const newColor = oppositeColor(onlineYourColor);
        setOnlineAttributes(onlineOpponentName, 
            newColor, onlineYourName, onlineStartClockMillis, onlineGameColorType);
    }

    resetBoard();
    resetGameStats();
    notationElem.innerHTML = getInitialNotationMessage();
    isPlaying = true;

    updateBoardPieces();
    playButtonElem.innerHTML = isOnlineMatch ? getResignGameIcon() : getRestartPlayAgainIcon();
}

function setUpModalSettings() {
    var modalWindowElem = document.querySelector(".settings-modal");
    var settingsButtonElem = document.querySelector(".js-settings-button");
    var closeSpanElem = document.getElementsByClassName("close")[0];

    settingsButtonElem.onclick = function() {
        modalWindowElem.style.display = "block";
    }

    closeSpanElem.onclick = function() {
        modalWindowElem.style.display = "none";
    }

    modalWindowElem.onclick = function(event) {
        if (event.target == modalWindowElem) {
            modalWindowElem.style.display = "none";
        }
    }
}

export function getResignGameIcon() {
    return '<img src="images/icons/resign_icon.png" class="icon">'
}

export function getRestartPlayAgainIcon() {
    return '<img src="images/icons/restart_play_again_icon.png" class="icon">';
}

export function getWelcomeMessage() {
    return `
    <p class="welcome-message"><span class="online-panel-index">&#x2022;</span> Enter your name to challenge opponents online.</p>
    <p class="welcome-message"><span class="online-panel-index">&#x2022;</span> Choose your favorite time control in the settings.</p> 
    <p class="welcome-message"><span class="online-panel-index">&#x2022;</span> Nobody around? Dive into singleplayer mode. (&#9658;)</p>
    `;
}

export function getInitialNotationMessage() {
    return `<span class="initial-notation-message">
        <span class="online-panel-index">&#x2022;</span> Moves unfold here!</span>`
}
