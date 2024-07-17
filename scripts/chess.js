import { initializeBoard, updateBoardPieces, notationElem, resetBoard, isOnlineMatch, flipBoard } from "./board.js";
import { findMatch, disconnectFromServer, resignOnlineGame } from "./client.js";
import { resetGameStats } from "./stats.js";

initializeBoard();

const playButtonElem = document.querySelector('.js-play-button');
const findMatchButtonElem = document.querySelector('.js-find-match-button');
const disconectButtonElem = document.querySelector('.js-disconnect-button');
const flipBoardButtonElem = document.querySelector('.js-flip-button');
playButtonElem.addEventListener('click', resetGameCompletely);
findMatchButtonElem.addEventListener('click', findMatch);
disconectButtonElem.addEventListener('click', disconnectFromServer);
flipBoardButtonElem.addEventListener('click', flipBoard);

export function resetGameCompletely() {
    if (isOnlineMatch) {
        resignOnlineGame();
    }

    resetGameLocally();
}

export function resetGameLocally() {
    resetBoard();
    resetGameStats();
    notationElem.innerHTML = '';

    updateBoardPieces();
    playButtonElem.innerText = isOnlineMatch ? 'Resign Game' : 'Restart Game';
}
