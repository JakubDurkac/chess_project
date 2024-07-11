import { isLegalMove } from "./logic.js";
import { gameStats } from "./stats.js";

export const boardSize = 8;
let chessBoard = [
    ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
    ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
    ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
];

let draggedPiece = null;
let originalSquare = null;

export function initializeBoard() {
    generateSquares();
    document.querySelectorAll('.chessboard-square')
        .forEach((buttonElem) => {
            let row = Number(buttonElem.id.charAt(0));
            let col = Number(buttonElem.id.charAt(1));

            visualizePiece(row, col, buttonElem);

            buttonElem.addEventListener('dragover', handleDragOver);
            buttonElem.addEventListener('drop', handleDrop);
        });
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
    return `<img src="images/pieces/${piece}.png" 
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
}

function handleDrop(event) {
    event.preventDefault();
    const targetSquare = event.currentTarget;

    const originalRow = Number(originalSquare.id.charAt(0));
    const originalCol = Number(originalSquare.id.charAt(1));
    const targetRow = Number(targetSquare.id.charAt(0));
    const targetCol = Number(targetSquare.id.charAt(1));

    if (isLegalMove([originalRow, originalCol], [targetRow, targetCol])) {
        makeMove([originalRow, originalCol], [targetRow, targetCol]);
        removeExtraPiece(); // in case of en passant

        targetSquare.innerHTML = '';
        targetSquare.appendChild(draggedPiece);

        promotePieceIfAny();
        castleRooksIfAny();
    } else {
        originalSquare.appendChild(draggedPiece);
    }

    console.log(chessBoard);
    console.log(gameStats.lastMove);
    console.log(gameStats.castlingRights);
}

function makeMove(fromCoords, toCoords) {
    const [fromRow, fromCol] = fromCoords;
    const [toRow, toCol] = toCoords;

    const piece = chessBoard[fromRow][fromCol];
    chessBoard[fromRow][fromCol] = null;

    updateLastMove(fromCoords, toCoords, piece);
    updateCastlingRights();

    chessBoard[toRow][toCol] = piece;
}

function updateLastMove(fromCoords, toCoords, piece) {
    const isWhite = isWhitePiece(piece);
    const pieceTaken = chessBoard[toCoords[0]][toCoords[1]];
    gameStats.lastMove = {
        fromCoords, toCoords, piece, isWhite, pieceTaken
    };
    
    if (wasEnpassant(fromCoords, toCoords, piece)) {
        gameStats.lastMove.toRemoveCoords = [toCoords[0] + (isWhite ? 1 : -1), toCoords[1]];
        gameStats.lastMove.pieceTaken = isWhite ? 'bp' : 'wp';
    } else {
        gameStats.lastMove.toRemoveCoords = null;
    }
}

function updateCastlingRights() {
    const {castlingRights} = gameStats;
    const {piece} = gameStats.lastMove;
    const color = isWhitePiece(piece) ? 'white' : 'black'; 

    if (piece === `${color[0]}k`) {
        castlingRights[color].canCastleKingside = false;
        castlingRights[color].canCastleQueenside = false;
    } else if (piece === `${color[0]}r`) {
        if (gameStats.lastMove.fromCoords[1] === 0) {
            castlingRights[color].canCastleQueenside = false;
        } else {
            castlingRights[color].canCastleKingside = false;
        }
    }
}

function wasEnpassant(fromCoords, toCoords, piece) {
    // if pawn diagonally takes an empty square
    return (piece === 'bp' || piece === 'wp')
            && fromCoords[1] !== toCoords[1] 
            && !getPieceTypeCode(toCoords[0], toCoords[1]);
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
    if (piece === 'wk' || piece === 'bk'
        && Math.abs(fromCoords[1] - toCoords[1]) === 2) {
            const row = isWhitePiece(piece) ? boardSize - 1 : 0;
            const col = toCoords[1] > fromCoords[1] ? boardSize - 1 : 0;

            const rook = chessBoard[row][col];
            removePieceFromBoard(row, col);
            
            const newCol = col === 0 ? toCoords[1] + 1 : toCoords[1] - 1;
            addPieceToBoard(row, newCol, rook);
    }
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

export function getColorCode(row, col) {
    return isEmptySquare(row, col) ? null : chessBoard[row][col].charAt(0);
}

function isWhitePiece(piece) {
    return piece.charAt(0) === 'w';
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