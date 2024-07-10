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

        let imageElem = buttonElem.querySelector('img');
        imageElem.addEventListener('dragstart', handleDragStart);
        imageElem.addEventListener('dragend', handleDragEnd);
    }
}

function initializeBoard() {
    document.querySelectorAll('.chessboard-square')
        .forEach((buttonElem) => {
            let row = Number(buttonElem.id.charAt(0));
            let col = Number(buttonElem.id.charAt(1));

            visualizePiece(row, col, buttonElem);

            buttonElem.addEventListener('dragover', handleDragOver);
            buttonElem.addEventListener('drop', handleDrop);
        });
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

    const targetRow = Number(targetSquare.id.charAt(0));
    const targetCol = Number(targetSquare.id.charAt(1));

    const originalRow = Number(originalSquare.id.charAt(0));
    const originalCol = Number(originalSquare.id.charAt(1));

    const piece = chessBoard[originalRow][originalCol];
    chessBoard[originalRow][originalCol] = null;
    chessBoard[targetRow][targetCol] = piece;

    targetSquare.innerHTML = '';
    targetSquare.appendChild(draggedPiece);
}

generateSquares();
initializeBoard();
