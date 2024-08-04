import { isLegalMove, getAllReachableCoords, isAttackedSquare, canPlayCuzKingSafe } from "./logic.js";
import { gameStats, updateLastMove, updateCastlingRights, updateMaterialCount, hasGameEnded, updateEnpassantRights, addPositionToGameHistory, isThreefoldRepetition, hasInsufficientMaterial, getChessboardDecompressed, highlightSquaresOfPosition, updateHighlightedSquaresOfPosition, playSoundOfPosition } from "./stats.js";
import { generateLastMoveNotation } from "./notation.js";
import { notifyServerGameEnded, sendMove } from "./client.js";
import { getRestartPlayAgainIcon, isPlaying } from "./chess.js";
import { addLogMessage, declineDraw, isOnlineMatch, onlineYourColor } from "./online.js";
import { makeSoundBasedOnLastMove, playSound } from "./sounds.js";

export const boardSize = 8;

export const chessBoardInitial = [
    ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
    ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
    ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
];

export let chessBoard = boardDeepCopy(chessBoardInitial);

export const notationElem = document.querySelector('.js-chess-notation-container');
let draggedPiece = null;
let originalSquare = null;
let dragoverSquare = null;

export let isFlippedBoard = false;
let opponentPromotionPieceCode = null;

export let displayedPositionNumber = 0;

export function initializeBoard() {
    generateSquares();
    document.querySelectorAll('.chessboard-square')
        .forEach((buttonElem) => {
            buttonElem.addEventListener('dragover', handleDragOver);
            buttonElem.addEventListener('drop', handleDrop);
        });

    createRankAndFileSigns();
}

function createRankAndFileSigns() {
    const containerElem = document.querySelector('.chessboard-container');
    const sides = ['first', 'second'];
    const types = ['rank', 'file'];
    const signSet = {
        'rank': isFlippedBoard ? '87654321' : '12345678',
        'file': isFlippedBoard ? 'hgfedcba' : 'abcdefgh'
    }

    types.forEach((type) => {
        sides.forEach((side) => {
            for (let i = 0; i < signSet[type].length; i++) {
                const char = signSet[type].charAt(i);
                const oldSign = document.getElementById(`${side}-${type}-sign-${String(i)}`);
                if (oldSign) {
                    containerElem.removeChild(oldSign);
                }

                const newSign = document.createElement('span');
                newSign.classList.add('sign');
                newSign.classList.add(`${side}-${type}-sign`);
                newSign.id = `${side}-${type}-sign-${String(i)}`;
                newSign.innerText = char;
                containerElem.appendChild(newSign);
            }
        });
    });
}

export function updateBoardPieces() {
    document.querySelectorAll('.chessboard-square')
    .forEach((buttonElem) => {
        removeAllHighlighting(buttonElem);

        let row = Number(buttonElem.id.charAt(0));
        let col = Number(buttonElem.id.charAt(1));

        visualizePiece(row, col, buttonElem);
    })
}

export function resetBoard() {
    setBoard(boardDeepCopy(chessBoardInitial));
    displayedPositionNumber = 0;
}

function removeAllHighlighting(buttonElem) {
    buttonElem.classList.remove('winner-square');
    buttonElem.classList.remove('loser-square');
    buttonElem.classList.remove('draw-square');
    buttonElem.classList.remove('last-move-highlight');
}

function getLightOrDarkSquareClass(row, col) {
    if ((row + col) % 2 == 0) {
        return 'light-square';
    }

    return 'dark-square';
}

function generateSquare(row, col) {
    if (isFlippedBoard) {
        const [flippedRow, flippedCol] = getFlippedCoords(row, col);
        row = flippedRow;
        col = flippedCol;
    }

    return `<button class="chessboard-square ${getLightOrDarkSquareClass(row, col)}"
                id="${String(row) + String(col)}"></button>`;
}

function getFlippedCoords(row, col) {
    return [boardSize - row - 1, boardSize - col - 1];
}

export function flipBoard() {
    isFlippedBoard = !isFlippedBoard;
    initializeBoard();

    if (isPlaying) {
        updateBoardPieces();
        rehighlightSquares();
    }
}

function rehighlightSquares() {
    const {lastMove, moveCount, result} = gameStats;
    if (lastMove.piece) {
        if (moveCount === displayedPositionNumber) {
            highlightLastMove(lastMove.fromCoords, lastMove.toCoords);
            if (result.keyword !== null) {
                if (result.keyword === 'win') {
                    highlightCheckmate(result.firstKingCoords,
                        result.secondKingCoords);
                } else {
                    highlightStalemate(result.firstKingCoords,
                        result.secondKingCoords);
                }
            }
        } else {
            highlightSquaresOfPosition(displayedPositionNumber - 1);
        }
    }
}

function generatePieceImage(piece) {
    return `<img src="images/pieces/maestro/${piece}.svg" 
                draggable="true"
                class="chess-piece-image">`;
}

function generateSquares() {
    let boardHTML = '';
    const chessBoardDivElem = document.querySelector('.js-chessboard');

    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            boardHTML += generateSquare(row, col);
        }
    }

    chessBoardDivElem.innerHTML = boardHTML;
}

function updateNotation() {
    if (gameStats.moveCount === 1) {
        notationElem.innerHTML = '';
    }

    const {moveCount} = gameStats;
    const lineBreak = moveCount % 2 === 0 ? '<br>' : '';
    if (moveCount % 2 === 1) {
        const indexElem = document.createElement('p');
        indexElem.className = 'chess-notation-index';
        indexElem.innerText = `${String((moveCount + 1) / 2)}.`;
        notationElem.appendChild(indexElem);
    }
    
    const moveTextElem = document.createElement('p');
    moveTextElem.id = `move-${String(moveCount)}`;
    moveTextElem.className = 'chess-notation-text chess-notation-text-current';
    moveTextElem.innerText = generateLastMoveNotation();
    notationElem.appendChild(moveTextElem);
    
    moveTextElem.addEventListener('click', () => {
        changeDisplayedPosition(moveCount);
    });

    if (lineBreak === '<br>') {
        const br = document.createElement('br');
        notationElem.appendChild(br);
    }

    const oldNotationTextElem = document.getElementById(`move-${String(moveCount - 1)}`);
    if (oldNotationTextElem) {
        oldNotationTextElem.classList.remove("chess-notation-text-current");
    }
    
    notationElem.scrollTop = notationElem.scrollHeight;
}

export function changeDisplayedPosition(toPositionNumber) {
    if (displayedPositionNumber === toPositionNumber) {
        return; // change to same position
    }

    const oldNotationTextElem = document.getElementById(`move-${String(displayedPositionNumber)}`);
    const newNotationTextElem = document.getElementById(`move-${String(toPositionNumber)}`);
    if (!oldNotationTextElem || !newNotationTextElem) {
        return;
    }

    oldNotationTextElem.classList.remove("chess-notation-text-current");
    newNotationTextElem.classList.add("chess-notation-text-current");

    displayedPositionNumber = toPositionNumber;
    setBoard(getChessboardDecompressed(toPositionNumber - 1));
    updateBoardPieces();
    playSoundOfPosition(toPositionNumber - 1);

    highlightSquaresOfPosition(toPositionNumber - 1);
}

function visualizePiece(row, col, buttonElem) {
    let piece = chessBoard[row][col];
    buttonElem.innerHTML = '';
    if (piece) {
        buttonElem.innerHTML = generatePieceImage(piece);

        let imageElem = buttonElem.querySelector('img');
        imageElem.addEventListener('dragstart', handleDragStart);
        imageElem.addEventListener('dragend', handleDragEnd);
    }
}

function handleDragStart(event) {
    draggedPiece = event.target;
    originalSquare = draggedPiece.parentNode;
    setTimeout(() => {
        draggedPiece.style.display = 'none';
    }, 0);
}

function handleDragEnd(event) {
    draggedPiece.style.display = 'block';
}

function handleDragOver(event) {
    event.preventDefault();
    
    if (dragoverSquare) {
        dragoverSquare.classList.remove('dragover-square');
    }

    originalSquare.classList.remove('dragover-square');
    dragoverSquare = event.target;
    dragoverSquare.classList.add('dragover-square');
}

function handleDrop(event) {
    event.preventDefault();
    dragoverSquare.classList.remove('dragover-square')
    const targetSquare = event.currentTarget;

    const fromCoords = getCoordsFromButton(originalSquare);
    const toCoords = getCoordsFromButton(targetSquare);

    if (isLegalMove(fromCoords, toCoords, isOnlineMatch)) {
        makeMoveWithExtra(fromCoords, toCoords);
    } else {
        const [row, col] = fromCoords;
        addPieceToBoard(row, col, chessBoard[row][col]);
        highlightSquare(originalSquare);
    }
}

export function makeMoveWithExtra(fromCoords, toCoords) {
    makeMove(fromCoords, toCoords);
    removeExtraPiece(); // in case of en passant
    promotePieceIfAny();
    castleRooksIfAny();
    updateMaterialCount();
    makeSoundBasedOnLastMove();
    handleGameOverIfAny();
    addPositionToGameHistory();
}

function handleGameOverIfAny() {
    if (!canOpponentMove()) {
        const canMoveColor = gameStats.isWhiteTurn ? 'black' : 'white';
        const cannotMoveColor = gameStats.isWhiteTurn ? 'white' : 'black';
        const [kingRow, kingCol] = gameStats.kingCoords[cannotMoveColor];
        if (isAttackedSquare(kingRow, kingCol, cannotMoveColor.charAt(0))) {
            announceCheckmate(gameStats.kingCoords[canMoveColor], [kingRow, kingCol]);
        } else {
            announceStalemate(gameStats.kingCoords[canMoveColor], [kingRow, kingCol]);
        }
    }

    if (!hasGameEnded()) {
        if (gameStats.movesSinceLastProgress >= 100) {
            announceSpecialDraw('50-Move-Rule');
        } else if (isThreefoldRepetition()) {
            announceSpecialDraw('Threefold Repetition');
        } else if (gameStats.movesSinceLastProgress === 0 &&
            hasInsufficientMaterial('w') && hasInsufficientMaterial('b')) {
            announceSpecialDraw('Insufficient Material');
        }
    }

    if (hasGameEnded()) {
        if (isOnlineMatch && onlineYourColor === 'white') {
            notifyServerGameEnded();
        }

        playSound('end');
    }
}

function highlightSquare(buttonElem) {
    buttonElem.classList.add('highlight-square');
    setTimeout(() => {
        buttonElem.classList.remove('highlight-square');
    }, 75);
    setTimeout(() => {
        buttonElem.classList.add('highlight-square');
    }, 150);
    setTimeout(() => {
        buttonElem.classList.remove('highlight-square');
    }, 200);
}

export function highlightLastMove(newFromCoords, newToCoords) {
    if (gameStats.moveCount > 0) {
        const {fromCoords, toCoords} = gameStats.lastMove;
        getButtonElemByCoords(fromCoords[0], fromCoords[1])
            .classList.remove('last-move-highlight');
        getButtonElemByCoords(toCoords[0], toCoords[1])
            .classList.remove('last-move-highlight');
    }

    getButtonElemByCoords(newFromCoords[0], newFromCoords[1])
        .classList.add('last-move-highlight');
    getButtonElemByCoords(newToCoords[0], newToCoords[1])
        .classList.add('last-move-highlight');
}

function makeMove(fromCoords, toCoords) {
    const [fromRow, fromCol] = fromCoords;
    const [toRow, toCol] = toCoords;

    if (isOnlineMatch && 
        (onlineYourColor === 'white') === gameStats.isWhiteTurn) {
        sendMove(fromCoords, toCoords);
        declineDrawIfNeeded();
    }

    const piece = chessBoard[fromRow][fromCol];
    highlightLastMove(fromCoords, toCoords);
    updateLastMove(fromCoords, toCoords, piece);
    updateCastlingRights(); 
    addPieceToBoard(toRow, toCol, piece);
    gameStats.isWhiteTurn = !gameStats.isWhiteTurn;
    gameStats.moveCount++;
    displayedPositionNumber++;
    updateEnpassantRights();
    updateNotation();
    removePieceFromBoard(fromRow, fromCol);
}

function canOpponentMove() {
    const colorCode = gameStats.isWhiteTurn ? 'w' : 'b';
	for (let row = 0; row < boardSize; row++) {
		for (let col = 0; col < boardSize; col++) {
			if (getColorCode(row, col) === colorCode) {
                const reachable = getAllReachableCoords([row, col]);
                if (reachable.length > 0) { 
                    if (reachable.find((toCoords) => {
                        return canPlayCuzKingSafe([row, col], toCoords, colorCode === 'w');
                    })) {
                        
                        return true; 
                    }
                }
            }
		}
	}

    return false;
}

function removeExtraPiece() {
    const coords = gameStats.lastMove.toRemoveCoords;
    if (coords) {
        removePieceFromBoard(coords[0], coords[1]);
    }
}

function promotePieceIfAny() {
    const {piece, toCoords} = gameStats.lastMove;
    if ((piece === 'wp' || piece === 'bp')  
        && (toCoords[0] === 0 || toCoords[0] === boardSize - 1)) {
            const pieceCodeAfterPromotion = getPromotionPieceCode();
            const pieceAfterPromotion = isWhitePiece(piece) 
                ? `w${pieceCodeAfterPromotion}` 
                : `b${pieceCodeAfterPromotion}`;
            addPieceToBoard(toCoords[0], toCoords[1], pieceAfterPromotion);
    }
}

function getPromotionPieceCode() {
    if (!isOnlineMatch || gameStats.isWhiteTurn !== (onlineYourColor === 'white')) {
        const pieceCode = getPlayerPromotionPieceCode();
        setSelectedPromotionTo('queen');
        return pieceCode;
    }

    return getOpponentPromotionPieceCode();
}

export function getPlayerPromotionPieceCode() {
    const promotionRadioElem = document.querySelector('input[name="promotion"]:checked');
    const promotionPieceCode = promotionRadioElem ? promotionRadioElem.value : 'q';
    
    return promotionPieceCode;
}

function getOpponentPromotionPieceCode() {
    return opponentPromotionPieceCode ? opponentPromotionPieceCode : 'q';
}

export function setOpponentPromotionPieceCode(promotionPieceCode) {
    opponentPromotionPieceCode = promotionPieceCode;
}

function castleRooksIfAny() {
    const {fromCoords, toCoords, piece} = gameStats.lastMove;
    if (wasCastling(fromCoords, toCoords, piece)) {
            const row = isWhitePiece(piece) ? boardSize - 1 : 0;
            const col = toCoords[1] > fromCoords[1] ? boardSize - 1 : 0;

            const rook = chessBoard[row][col];
            removePieceFromBoard(row, col);
            
            const newCol = col === 0 ? toCoords[1] + 1 : toCoords[1] - 1;
            addPieceToBoard(row, newCol, rook);
    }
}

function setSelectedPromotionTo(pieceName) {
    const radio = document.getElementById(`promotion-${pieceName}`);
    if (radio) {
        radio.checked = true;
    }
}

export function announceCheckmate(winnerKingCoords, loserKingCoords) {
    changeDisplayedPosition(gameStats.moveCount);
    highlightCheckmate(winnerKingCoords, loserKingCoords);
    setResult('win', winnerKingCoords, loserKingCoords);
}

export function announceStalemate(firstKingCoords, secondKingCoords) {
    changeDisplayedPosition(gameStats.moveCount);
    highlightStalemate(firstKingCoords, secondKingCoords);
    setResult('draw', firstKingCoords, secondKingCoords);
}

export function announceSpecialDraw(drawMessage) {
    const canMoveColor = gameStats.isWhiteTurn ? 'black' : 'white';
    const cannotMoveColor = gameStats.isWhiteTurn ? 'white' : 'black';
    const [kingRow, kingCol] = gameStats.kingCoords[cannotMoveColor];
    announceStalemate(gameStats.kingCoords[canMoveColor], [kingRow, kingCol]);
    addLogMessage(`Draw: ${drawMessage}.`);
}

export function highlightCheckmate(winnerKingCoords, loserKingCoords) {
    getButtonElemByCoords(winnerKingCoords[0], winnerKingCoords[1])
        .classList.add('winner-square');
    getButtonElemByCoords(loserKingCoords[0], loserKingCoords[1])
        .classList.add('loser-square');
}

export function highlightStalemate(firstKingCoords, secondKingCoords) {
    getButtonElemByCoords(firstKingCoords[0], firstKingCoords[1])
        .classList.add('draw-square');
    getButtonElemByCoords(secondKingCoords[0], secondKingCoords[1])
        .classList.add('draw-square');
}

function setResult(keyword, firstKingCoords, secondKingCoords) {
    gameStats.result = {keyword, firstKingCoords, secondKingCoords};
    if (isOnlineMatch) {
        updateOnlineScore();
    }

    document.querySelector('.js-play-button').innerHTML = getRestartPlayAgainIcon();
}

export function updateScoreResignation(resigneeColor) {
    if (gameStats.moveCount > 2 && !hasGameEnded()) {
        const winnerColor = oppositeColor(resigneeColor);
        announceCheckmate(gameStats.kingCoords[winnerColor], gameStats.kingCoords[resigneeColor]);
        updateHighlightedSquaresOfPosition();
    }
}

function updateOnlineScore() {
    const {keyword, firstKingCoords} = gameStats.result;
    const [firstRow, firstCol] = firstKingCoords;
    const firstKingColor = chessBoard[firstRow][firstCol] === 'wk' ? 'white' : 'black';
    const secondKingColor = oppositeColor(firstKingColor);

    const firstScoreElem = document.querySelector(`.online-score-${firstKingColor}`);
    const secondScoreElem = document.querySelector(`.online-score-${secondKingColor}`);

    if (!firstScoreElem || !secondScoreElem) {
        return;
    }

    if (keyword === 'win') {
        firstScoreElem.innerText = Number(firstScoreElem.innerText) + 1;
    } else if (keyword === 'draw') {
        firstScoreElem.innerText = Number(firstScoreElem.innerText) + 0.5;
        secondScoreElem.innerText = Number(secondScoreElem.innerText) + 0.5;
    }
}

function declineDrawIfNeeded() {
    const acceptDrawButtonElem = document.querySelector('.js-accept-draw-button');
    const declineDrawButtonElem = document.querySelector('.js-decline-draw-button');

    if (!acceptDrawButtonElem || !declineDrawButtonElem) {
        return;
    }

    declineDraw();
}

function addPieceToBoard(row, col, piece) {
    chessBoard[row][col] = piece;
    visualizePiece(row, col, getButtonElemByCoords(row, col));
}

function removePieceFromBoard(row, col) {
    chessBoard[row][col] = null;
    getButtonElemByCoords(row, col).innerHTML = '';    
}

function getButtonElemByCoords(row, col) {
    return document.getElementById(`${String(row)}${String(col)}`);
}

function getCoordsFromButton(buttonElem) {
    return [Number(buttonElem.id.charAt(0)), Number(buttonElem.id.charAt(1))];
}

export function wasEnpassant(fromCoords, toCoords, piece) {
    // if pawn diagonally takes an empty square
    return (piece === 'bp' || piece === 'wp')
            && fromCoords[1] !== toCoords[1] 
            && isEmptySquare(toCoords[0], toCoords[1]);
}

export function wasCastling(fromCoords, toCoords, piece) {
    return (piece === 'bk' || piece === 'wk') 
            && Math.abs(fromCoords[1] - toCoords[1]) === 2
}

export function wasPromotion(toRow, piece) {
    return (piece === 'bp' || piece === 'wp')
            && (toRow === 0 || toRow === boardSize - 1);
}

export function isWhitePiece(piece) {
    return piece.charAt(0) === 'w';
}

export function getColorCode(row, col) {
    return isEmptySquare(row, col) ? null : chessBoard[row][col].charAt(0);
}

export function getPieceTypeCode(row, col) {
    return isEmptySquare(row, col) ? null : chessBoard[row][col].charAt(1);
}

export function typeCodePiece(piece) {
    return piece.charAt(1);
}

export function isEmptySquare(row, col) {
    return !isInRange(row, col) || chessBoard[row][col] === null;
}

export function isInRange(row, col) {
    return row >= 0 && col >= 0 && row < boardSize && col < boardSize;
}

export function setBoard(board) {
    chessBoard = board;
}

export function boardDeepCopy(board) {
    let boardCopy = [];
    board.forEach((row) => {
        let rowCopy = [];
        row.forEach((piece) => {
            rowCopy.push(piece);
        })

        boardCopy.push(rowCopy);
    });

    return boardCopy;
}

export function oppositeColor(color) {
    if (color === 'white') {
        return 'black';
    }

    if (color === 'black') {
        return 'white';
    }
}