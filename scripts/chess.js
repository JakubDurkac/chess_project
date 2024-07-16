import { initializeBoard, updateBoardPieces, notationElem, resetBoard } from "./board.js";
import { findMatch } from "./client.js";
import { resetGameStats } from "./stats.js";

initializeBoard();

const playButtonElem = document.querySelector('.js-play-button');
const findMatchButtonElem = document.querySelector('.js-find-match-button');
playButtonElem.addEventListener('click', handlePlayButtonClick);
findMatchButtonElem.addEventListener('click', findMatch);

function handlePlayButtonClick() {
    resetGameCompletely();
    
    playButtonElem.innerText = 'Restart Game';
}

export function resetGameCompletely() {
    resetBoard();
    resetGameStats();
    notationElem.innerHTML = '';

    updateBoardPieces();
}
