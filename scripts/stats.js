import { chessBoard, wasEnpassant, wasPromotion, isWhitePiece, getPieceTypeCode, boardSize } from "./board.js";
import { updateMaterialCountDifference } from "./online.js";

const gameStatsInitial = {
    lastMove: {
        fromCoords: [null, null],
        toCoords: [null, null],
        piece: null,
        isWhite: null,
        pieceTaken: null,
        toRemoveCoords: null, // piece taken with en passant 
    },
    castlingRights: {
        white: {
            canCastleKingside: true,
            canCastleQueenside: true
        },
        black: {
            canCastleKingside: true,
            canCastleQueenside: true
        },
    },
    enpassantRights: {
        passerCol: null, 
    },
    kingCoords: {
        white: [7, 4],
        black: [0, 4]
    },
    isWhiteTurn: true,
    moveCount: 0,
    materialCount: {
        white: 39,
        black: 39
    },
    movesSinceLastProgress: 0, // since last pawn push or capture
    result: {
        // <firstKingCoords> won or drew against the <secondKingCoords>
        keyword: null, // 'win' / 'draw'
        firstKingCoords: null, // [row, col]
        secondKingCoords: null
    }
};

export let gameStats = JSON.parse(JSON.stringify(gameStatsInitial));

export function resetGameStats() {
    gameStats = JSON.parse(JSON.stringify(gameStatsInitial));
}

let gameHistory = [];

export function resetGameHistory() {
    gameHistory = [];
}

export function addPositionToGameHistory() {
    gameHistory.push({compressed: [generateChessboardCompressed(), generateGameStatsCompressed()].join('/'), movesSinceProgress: gameStats.movesSinceLastProgress});
}

function generateChessboardCompressed() {
    let result = [];
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            result.push(chessBoard[row][col] ?? '0');
        }
    }

    return result.join('');
}

function generateGameStatsCompressed() {
    const {isWhiteTurn, castlingRights, enpassantRights} = gameStats;
    let result = [];

    result.push(isWhiteTurn ? 'w' : 'b');
    result.push(compressCastlingRights(castlingRights));
    result.push(enpassantRights.passerCol ?? '0');

    return result.join('');
}

function compressCastlingRights(castlingRights) {
    let result = '';
    if (castlingRights.white.canCastleKingside) {
        result += 'K';
    }

    if (castlingRights.white.canCastleQueenside) {
        result += 'Q';
    }

    if (castlingRights.black.canCastleKingside) {
        result += 'k';
    }

    if (castlingRights.black.canCastleQueenside) {
        result += 'q';
    }

    return result;
}

export function isThreefoldRepetition() {
    const size = gameHistory.length;
    if (size < 6) { // 3 repeats for same colored turn is not possible
        return false;
    }

    let repeats = 1;
    const lastPosition = gameHistory[size - 1].compressed;
    let movesSinceProgress = gameHistory[size - 1].movesSinceProgress;
    for (let i = size - 3; i >= 0; i -= 2) { // check same colored turn positions
        const olderMovesSinceProgress = gameHistory[i].movesSinceProgress;
        if (olderMovesSinceProgress > movesSinceProgress) { // capture or pawn push happened
            return false;
        }

        movesSinceProgress = olderMovesSinceProgress;
        if (lastPosition === gameHistory[i].compressed) {
            repeats++;
            if (repeats >= 3) {
                return true;
            }
        }
    }

    return false;
}

const pieceValue = {
    'r': 5,
    'n': 3,
    'b': 3,
    'q': 9,
    'p': 1
};

export function updateLastMove(fromCoords, toCoords, piece) {
    const isWhite = isWhitePiece(piece);
    const pieceTaken = chessBoard[toCoords[0]][toCoords[1]];
    gameStats.lastMove = {
        fromCoords, toCoords, piece, isWhite, pieceTaken
    };
    
    if (piece === 'wk' || piece === 'bk') {
        const color = isWhite ? 'white' : 'black';
        gameStats.kingCoords[color] = toCoords;
    }

    if (wasEnpassant(fromCoords, toCoords, piece)) {
        gameStats.lastMove.toRemoveCoords = [toCoords[0] + (isWhite ? 1 : -1), toCoords[1]];
        gameStats.lastMove.pieceTaken = isWhite ? 'bp' : 'wp';
    } else {
        gameStats.lastMove.toRemoveCoords = null;
    }
    
    if (pieceTaken || piece === 'wp' || piece === 'bp') {
        gameStats.movesSinceLastProgress = 0;
    } else {
        gameStats.movesSinceLastProgress++;
    }
}

export function updateCastlingRights() {
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

export function updateEnpassantRights() {
    const {lastMove, enpassantRights} = gameStats;
    const {piece, fromCoords, toCoords} = lastMove;
    if ((piece === 'wp' || piece === 'bp') &&
        Math.abs(fromCoords[0] - toCoords[0]) === 2) {
        enpassantRights.passerCol = fromCoords[1];

    } else {
        enpassantRights.passerCol = null;
    }
}

export function updateMaterialCount() {
    const {toCoords, piece, isWhite, pieceTaken} = gameStats.lastMove;
    const color = isWhite ? 'white' : 'black';
    const opponentColor = isWhite ? 'black' : 'white';

    if (pieceTaken) {
        gameStats.materialCount[opponentColor] -= pieceValue[pieceTaken.charAt(1)];        
    }

    if (wasPromotion(toCoords[0], piece)) {
        gameStats.materialCount[color] += pieceValue[getPieceTypeCode(toCoords[0], toCoords[1])] - 1;
    }

    updateMaterialCountDifference();
}

export function hasGameEnded() {
    return gameStats.result.keyword !== null;
}