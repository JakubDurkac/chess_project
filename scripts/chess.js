import { initializeBoard, updateBoardPieces, chessBoardInitial, boardDeepCopy, setBoard } from "./board.js";
import { resetGameStats } from "./stats.js";

initializeBoard();

const playButtonElem = document.querySelector('.js-play-button');
playButtonElem.addEventListener('click', handlePlayButtonClick);

function handlePlayButtonClick() {
    setBoard(boardDeepCopy(chessBoardInitial));
    resetGameStats();

    updateBoardPieces();
    
    playButtonElem.innerText = 'Restart Game';
}
