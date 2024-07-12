import { chessBoard, wasEnpassant, isWhitePiece } from "./board.js";

export const gameStats = {
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
    kingCoords: {
        white: [7, 4],
        black: [0, 4]
    }
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