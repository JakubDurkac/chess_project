import { chessBoard, wasEnpassant, wasPromotion, isWhitePiece } from "./board.js";

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

const pieceValue = {
    'r': 5,
    'n': 3,
    'b': 3,
    'q': 9,
    'p': 1
};

let autoPromotionPieceCode = 'q';

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

export function updateMaterialCount() {
    const {toCoords, piece, isWhite, pieceTaken} = gameStats.lastMove;
    const color = isWhite ? 'white' : 'black';
    const opponentColor = isWhite ? 'black' : 'white';

    if (pieceTaken) {
        gameStats.materialCount[opponentColor] -= pieceValue[pieceTaken.charAt(1)];        
    }

    if (wasPromotion(toCoords[0], piece)) {
        gameStats.materialCount[color] += pieceValue[autoPromotionPieceCode] - 1;
    }
}