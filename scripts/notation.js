import { gameStats } from "./stats.js";
import { typeCodePiece, chessBoard, boardSize } from "./board.js";
import { canPlayCuzKingSafe, reachableFunctions } from "./logic.js";

const ASCII_CODE_A = 97;
export function generateLastMoveNotation() {
    const {fromCoords, toCoords, piece, isWhite, pieceTaken} = gameStats.lastMove;
    const pieceTypeCode = typeCodePiece(piece);

    const fromNotation = coordsToNotation(fromCoords);
    const toNotation = coordsToNotation(toCoords);

    let notation = ''; 
    if (pieceTypeCode === 'p') {
        notation += pieceTaken ? getFile(fromNotation) : '';
    } else if (pieceTypeCode === 'k') {
        if (Math.abs(fromCoords[1] - toCoords[1]) === 2) {
            return toCoords[1] > fromCoords[1] ? 'O-O' : 'O-O-O';
        } else {
            notation += 'K';
        }

    } else {
        notation += (pieceTypeCode.toUpperCase()
                 + specifyNotation(pieceTypeCode, isWhite ? 'w' : 'b', fromCoords, toCoords));
    }

    return notation + (pieceTaken ? 'x' : '') + toNotation;
}

function specifyNotation(pieceTypeCode, colorCode, fromCoords, toCoords) {
    let fileSpecification = '';
    let rankSpecification = '';
    const opponentColorCode = colorCode === 'w' ? 'b' : 'w';
    const reachable = reachableFunctions[pieceTypeCode](
        toCoords[0], toCoords[1], opponentColorCode);

    const concurrentCoords = reachable.filter((coords) => {
        return chessBoard[coords[0]][coords[1]] === colorCode + pieceTypeCode &&
            !(coords[0] === fromCoords[0] && coords[1] === fromCoords[1]); // no self concurrence
    });

    concurrentCoords.forEach((coords) => {
        if (canPlayCuzKingSafe(coords, toCoords, opponentColorCode !== 'w')) {
            if (fromCoords[1] === coords[1]) {
                rankSpecification = getRank(coordsToNotation(fromCoords));
            } else {
                fileSpecification = getFile(coordsToNotation(fromCoords));
            }
        }
    });

    return fileSpecification + rankSpecification;
}

function coordsToNotation(coords) {
    // e.g. [0, 0] -> 'a7'; [7, 7] -> 'h1'
    const [row, col] = coords;
    return String.fromCharCode(ASCII_CODE_A + col) + String(boardSize - row);
}

function getFile(notation) {
    return notation.charAt(0);
}

function getRank(notation) {
    return notation.charAt(1);
}