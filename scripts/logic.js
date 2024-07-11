import { getColorCode, getPieceTypeCode, boardSize, isEmptySquare, isInRange } from "./board.js";

export function isLegalMove(originalCoords, targetCoords) {
    console.log(getAllReachableCoords(originalCoords));
    if (!containsCoords(getAllReachableCoords(originalCoords), targetCoords)) {
        return false;
    }
    
    return true;
}

function areEqualCoords(coords1, coords2) {
    return coords1[0] === coords2[0] && coords1[1] === coords2[1];
}

function containsCoords(allCords, targetCoords) {
    for (let i = 0; i < allCords.length; i++) {
        if (areEqualCoords(allCords[i], targetCoords)) {
            return true;
        }
    }

    return false;
}

function getAllReachableCoords(originalCoords) {
    let [x, y] = originalCoords;
    const colorCode = getColorCode(x, y); // 'b' or 'w'
    const pieceTypeCode = getPieceTypeCode(x, y);

    switch (pieceTypeCode) {
        case 'r':
            return reachableByRook(x, y, colorCode);
        case 'n':
            return reachableByKnight(x, y, colorCode);
        case 'b':
            return reachableByBishop(x, y, colorCode);
        case 'q':
            return reachableByQueen(x, y, colorCode);
        case 'k':
            return reachableByKing(x, y, colorCode);
        case 'p':
            return reachableByPawn(x, y, colorCode);
        default:
            return [];
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
            [1, 1], [1, -1], [-1, 1], [-1, -1]]
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
    return reachableWithShortRange(x, y, colorCode, motionPatterns.king);
};

function reachableByPawn(x, y, colorCode) {
    return [[3, 3], [4, 3], [5, 3], [6, 3]];
};
