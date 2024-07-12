import { chessBoard, boardSize, getColorCode, getPieceTypeCode, isEmptySquare, isInRange, wasEnpassant, isWhitePiece, setBoard, wasCastling } from "./board.js";
import { gameStats } from "./stats.js";

export function isLegalMove(fromCoords, toCoords) {
    if (!containsCoords(getAllReachableCoords(fromCoords), toCoords)) {
        return false;
    }

    let boardBackup = boardDeepCopy(chessBoard);
    
    const hasMovedKing = simulateMove(fromCoords, toCoords);
    const isWhite = isWhitePiece(chessBoard[toCoords[0]][toCoords[1]]);
    const color = isWhite ? 'white' : 'black'; 
    const kingCoords = hasMovedKing ? toCoords : gameStats.kingCoords[color];
    const isKingUnderAttack = isAttackedSquare(kingCoords[0], kingCoords[1], color.charAt(0));

    setBoard(boardBackup);
    
    return !isKingUnderAttack;
}

function isAttackedSquare(x, y, colorCode) {
    const pieceCodes = 'rnbqkp';
    for (let i = 0; i < pieceCodes.length; i++) {
        if (reachableFunctions[pieceCodes[i]](x, y, colorCode).find((coords) => {
            return getPieceTypeCode(coords[0], coords[1]) === pieceCodes[i];
            })) {
            
            return true;
        }
    }

    return false;
}

function boardDeepCopy(chessBoard) {
    let boardCopy = [];
    chessBoard.forEach((row) => {
        let rowCopy = [];
        row.forEach((piece) => {
            rowCopy.push(piece);
        })

        boardCopy.push(rowCopy);
    });

    return boardCopy;
}

const reachableFunctions = {
    'r': reachableByRook,
    'n': reachableByKnight,
    'b': reachableByBishop,
    'q': reachableByQueen,
    'k': reachableByKing,
    'p': reachableByPawn
};

function getAllReachableCoords(fromCoords) {
    let [x, y] = fromCoords;
    const colorCode = getColorCode(x, y); // 'b' or 'w'
    const pieceTypeCode = getPieceTypeCode(x, y);

    return reachableFunctions[pieceTypeCode](x, y, colorCode);
}

function simulateMove(fromCoords, toCoords) {
    const [fromRow, fromCol] = fromCoords;
    const [toRow, toCol] = toCoords;

    const movedPiece = chessBoard[fromRow][fromCol];

    chessBoard[fromRow][fromCol] = null;
    chessBoard[toRow][toCol] = movedPiece;

    simulateCastlingIfAny(fromCoords, toCoords, movedPiece);
    simulateEnPassantIfAny(fromCoords, toCoords, movedPiece);

    return movedPiece === 'wk' || movedPiece === 'bk';
}

function simulateCastlingIfAny(fromCoords, toCoords, movedPiece) {
    const [fromRow, fromCol] = fromCoords;
    const [toRow, toCol] = toCoords;
    if (wasCastling(fromCoords, toCoords, movedPiece)) {
            const rookCol = toCol > fromCol ? boardSize - 1 : 0;
            const rook = chessBoard[toRow][rookCol];
            chessBoard[toRow][rookCol] = null;
            chessBoard[toRow][toCol + (rookCol === 0 ? 1 : -1)] = rook;
    }
}

function simulateEnPassantIfAny(fromCoords, toCoords, movedPiece) {
    if (wasEnpassant(fromCoords, toCoords, movedPiece)) {
        chessBoard[toCoords[0] + (isWhitePiece(movedPiece) ? 1 : -1)][toCoords[1]] = null;
    }
}

const motionPatterns = {
    rook: [[1, 0], [-1, 0], [0, 1], [0, -1]], // orthogonal long range
    bishop: [[1, 1], [1, -1], [-1, 1], [-1, -1]], // diagonal long range
    knight: [[1, 2], [1, -2], [-1, 2], [-1, -2], // L-shape short range
             [2, 1], [2, -1], [-2, 1], [-2, -1]],
    queen: [[1, 0], [-1, 0], [0, 1], [0, -1], // orthogonal + diagonal long range
            [1, 1], [1, -1], [-1, 1], [-1, -1]],
    king: [[1, 0], [-1, 0], [0, 1], [0, -1], // orthogonal + diagonal short range
            [1, 1], [1, -1], [-1, 1], [-1, -1]],
};

function reachableWithLongRange(x, y, colorCode, pattern) {
    const reachable = [];
    pattern.forEach((coordsOffset) => {
        const [xDiff, yDiff] = coordsOffset;
        for (let i = 1; isInRange(x + i * xDiff, y + i * yDiff); i++) {
            let row = x + i * xDiff;
            let col = y + i * yDiff;
            if (isEmptySquare(row, col)) {
                reachable.push([row, col]);
            } else {
                const targetPieceColor = getColorCode(row, col);
                if (targetPieceColor !== colorCode) {
                    reachable.push([row, col]);
                }
    
                break;
            }
        }
    });

    return reachable;
}

function reachableWithShortRange(x, y, colorCode, pattern) {
    const reachable = [];
    pattern.forEach((coordsOffset) => {
        let row = x + coordsOffset[0];
        let col = y + coordsOffset[1];
        if (isInRange(row, col) 
            && (isEmptySquare(row, col) || getColorCode(row, col) !== colorCode)) {
            reachable.push([row, col]);
        }
    });

    return reachable;
};

function reachableByRook(x, y, colorCode) {
    return reachableWithLongRange(x, y, colorCode, motionPatterns.rook);
}

function reachableByBishop(x, y, colorCode) {
    return reachableWithLongRange(x, y, colorCode, motionPatterns.bishop);
};

function reachableByQueen(x, y, colorCode) {
    return reachableWithLongRange(x, y, colorCode, motionPatterns.queen);
};

function reachableByKnight(x, y, colorCode) {
    return reachableWithShortRange(x, y, colorCode, motionPatterns.knight);
};

function reachableByKing(x, y, colorCode) {
    return reachableWithShortRange(x, y, colorCode, motionPatterns.king)
        .concat(getCastlingMoves(x, y, colorCode));
};

function getCastlingMoves(x, y, colorCode) {
    const color = colorCode === 'w' ? 'white' : 'black';
    const reachable = [];

    // checks for empty squares between king and rook
    // for each side
    const sides = ['canCastleKingside', 'canCastleQueenside'];
    sides.forEach((side, i) => {
        if (gameStats.castlingRights[color][side]) {
            reachable.push([x, y - 4 * i + 2]);
            let col = y - 2 * i + 1;
            while (i === 0 ? col < boardSize - 1 : col > 0) {
                if (!isEmptySquare(x, col)) {
                    reachable.pop();
                    break;
                }

                col += -2 * i + 1;   
            }
        }
    });

    return reachable;
}

function reachableByPawn(x, y, colorCode) {
    const reachable = [];
    const isWhite = colorCode === 'w'; 
    let row = x + (isWhite ? -1 : 1);
    let col = y;
    if (isEmptySquare(row, col)) {
        reachable.push([row, col]);
        row += (isWhite ? -1 : 1);
        if (isEmptySquare(row, col) && isPawnOnStartSquare(x, isWhite)) {
            reachable.push([row, col]);
        }
    }

    row = x + (isWhite ? -1 : 1);
    for (col = y - 1; col <= y + 1; col += 2) {
        if (!isEmptySquare(row, col) && getColorCode(row, col) !== colorCode) {
            reachable.push([row, col]);
        }
    }

    if ((isWhite && x === boardSize - 5) || (!isWhite && x === 4)) {
        reachable.push(getEnPassant(x, y, isWhite));
    }
    
    return reachable;
};

function getEnPassant(row, col, isWhite) {
    const {fromCoords, toCoords, piece} = gameStats.lastMove;
    if (piece === isWhite ? 'bp' : 'wp' 
        && Math.abs(fromCoords[0] - toCoords[0]) === 2 
        && (toCoords[1] === col + 1 || toCoords[1] === col - 1)) {
            return [row + (isWhite ? -1 : 1), toCoords[1]];
    }

    return [-1, -1];
}

function isPawnOnStartSquare(row, isWhite) {
    if (isWhite) {
        return row == boardSize - 2;
    }

    return row == 1;
}

function areEqualCoords(coords1, coords2) {
    return coords1[0] === coords2[0] && coords1[1] === coords2[1];
}

function containsCoords(allCords, toCoords) {
    for (let i = 0; i < allCords.length; i++) {
        if (areEqualCoords(allCords[i], toCoords)) {
            return true;
        }
    }

    return false;
}
