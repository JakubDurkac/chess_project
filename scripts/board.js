import { isLegalMove, getAllReachableCoords, isAttackedSquare, canPlayCuzKingSafe } from "./logic.js";
import { gameStats, updateLastMove, updateCastlingRights, updateMaterialCount } from "./stats.js";

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

let draggedPiece = null;
let originalSquare = null;
let dragoverSquare = null;

export function initializeBoard() {
    generateSquares();
    document.querySelectorAll('.chessboard-square')
        .forEach((buttonElem) => {
            let row = Number(buttonElem.id.charAt(0));
            let col = Number(buttonElem.id.charAt(1));

            buttonElem.addEventListener('dragover', handleDragOver);
            buttonElem.addEventListener('drop', handleDrop);
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
    return `<button class="chessboard-square ${getLightOrDarkSquareClass(row, col)}"
                id="${String(row) + String(col)}"></button>`;
}

function generatePieceImage(piece) {
    return `<img src="images/pieces/space/${piece}.png" 
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

    if (isLegalMove(fromCoords, toCoords)) {
        makeMove(fromCoords, toCoords);
        removeExtraPiece(); // in case of en passant
        promotePieceIfAny();
        castleRooksIfAny();
    } else {
        const [row, col] = fromCoords;
        addPieceToBoard(row, col, chessBoard[row][col]);
        highlightSquare(originalSquare);
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

function highlightLastMove(newFromCoords, newToCoords) {
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

    const piece = chessBoard[fromRow][fromCol];
    removePieceFromBoard(fromRow, fromCol);

    highlightLastMove(fromCoords, toCoords);
    updateLastMove(fromCoords, toCoords, piece);
    updateCastlingRights();
    updateMaterialCount();
    gameStats.isWhiteTurn = !gameStats.isWhiteTurn;
    gameStats.moveCount++;

    addPieceToBoard(toRow, toCol, piece);
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

    console.log(gameStats);
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
            const pieceAfterPromotion = isWhitePiece(piece) ? 'wq' : 'bq';
            addPieceToBoard(toCoords[0], toCoords[1], pieceAfterPromotion);
    }
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

function announceCheckmate(winnerKingCoords, loserKingCoords) {
    getButtonElemByCoords(winnerKingCoords[0], winnerKingCoords[1])
        .classList.add('winner-square');
    getButtonElemByCoords(loserKingCoords[0], loserKingCoords[1])
        .classList.add('loser-square');
}

function announceStalemate(kingCoordsFirst, kingCoordsSecond) {
    getButtonElemByCoords(kingCoordsFirst[0], kingCoordsFirst[1])
        .classList.add('draw-square');
    getButtonElemByCoords(kingCoordsSecond[0], kingCoordsSecond[1])
        .classList.add('draw-square');
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