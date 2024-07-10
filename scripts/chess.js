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

function getLightOrDarkSquareClass(row, col) {
    if ((row + col) % 2 == 0) {
        return 'light-square';
    }

    return 'dark-square';
}

function generateSquare(row, col) {
    return `<button class="chessboard-square ${getLightOrDarkSquareClass(row, col)}"
                id="${String(row) + String(col)}">${String(row) + String(col)}
            </button>`;
}

function generatePieceImage(piece) {
    return `<img src="images/pieces/${piece}.png" class="chess-piece-image">`;
}

function generateSquares() {
    let boardHTML = '';
    const chessBoardDivElem = document.querySelector('.js-chessboard');

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            boardHTML += generateSquare(row, col);
        }
    }

    chessBoardDivElem.innerHTML = boardHTML;
}

function visualizePiece(row, col, buttonElem) {
    let piece = chessBoard[row][col];

    if (piece) {
        buttonElem.innerHTML = generatePieceImage(piece);
    }
}

function updateBoard() {
    document.querySelectorAll('.chessboard-square')
        .forEach((buttonElem) => {
            let row = Number(buttonElem.id.charAt(0));
            let col = Number(buttonElem.id.charAt(1));

            visualizePiece(row, col, buttonElem);
        });
}

generateSquares();
updateBoard();
