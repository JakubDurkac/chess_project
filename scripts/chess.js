import { initializeBoard, updateBoardPieces, notationElem, resetBoard, flipBoard, updateScoreResignation, oppositeColor } from "./board.js";
import { findMatch, disconnectFromServer, resignOnlineGame } from "./client.js";
import { resetGameStats } from "./stats.js";
import { isOnlineMatch, onlineGameColorType, onlineOpponentName, onlineStartClockMillis, onlineYourColor, onlineYourName, setOnlineAttributes } from "./online.js"

setUpModalSettings();
initializeBoard();
export let isPlaying = false;

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
    notationElem.innerHTML = '';
    isPlaying = true;

    updateBoardPieces();
    playButtonElem.innerText = isOnlineMatch ? 'Resign Game' : 'Restart Game';
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
