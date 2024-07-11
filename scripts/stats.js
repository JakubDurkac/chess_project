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
    }
};