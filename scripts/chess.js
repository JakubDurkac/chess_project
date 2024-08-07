import { initializeBoard, updateBoardPieces, notationElem, resetBoard, flipBoard, updateScoreResignation, oppositeColor, changeDisplayedPosition, displayedPositionNumber } from "./board.js";
import { findMatch, disconnectFromServer, resignOnlineGame, sendDrawOffer, setCanOfferDraw, sendChatMessage, isConnected } from "./client.js";
import { gameStats, resetGameHistory, resetGameStats } from "./stats.js";
import { addLogMessage, isOnlineMatch, onlineGameColorType, onlineOpponentName, onlineStartClockMillis, onlineYourColor, onlineYourName, setOnlineAttributes, updateMaterialCountDifference } from "./online.js"
import { playSound } from "./sounds.js";

setUpModalSettings();

initializeBoard();
export let isPlaying = false;

document.querySelector('.online-panel').innerHTML = getWelcomeMessage();
notationElem.innerHTML = getInitialNotationMessage();
const promotionSettingsElem = document.querySelector('.promotion-settings');
resetPromotionSettings('white');

const playButtonElem = document.querySelector('.js-play-button');
const findMatchButtonElem = document.querySelector('.js-find-match-button');
const disconectButtonElem = document.querySelector('.js-disconnect-button');
const flipBoardButtonElem = document.querySelector('.js-flip-button');
const drawOfferButtonElem = document.querySelector('.js-draw-offer-button');
const chatSendButtonElem = document.querySelector('.js-chat-send-button');
const chatInputElem = document.querySelector('.js-chat-input');

playButtonElem.addEventListener('click', resetGameCompletely);
findMatchButtonElem.addEventListener('click', findMatch);
disconectButtonElem.addEventListener('click', () => {
    if (isConnected) {
        if (isOnlineMatch) {
            updateScoreResignation(onlineYourColor);
        }

        disconnectFromServer();

    } else {
        addLogMessage('Already offline.');
    }
});
flipBoardButtonElem.addEventListener('click', flipBoard);
drawOfferButtonElem.addEventListener('click', () => {
    if (isOnlineMatch) {
        sendDrawOffer();
    } else {
        addLogMessage('No draw offers in singleplayer.');
    }
});
chatSendButtonElem.addEventListener('click', sendChatMessage);
chatInputElem.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendChatMessage();
    }
});
document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowLeft' && displayedPositionNumber - 1 >= 1) {
        changeDisplayedPosition(displayedPositionNumber - 1);
    } else if (event.key === 'ArrowRight' && displayedPositionNumber + 1 <= gameStats.moveCount) {
        changeDisplayedPosition(displayedPositionNumber + 1);
    }
});

export function resetGameCompletely() {
    if (isOnlineMatch) {
        resignOnlineGame();
        updateScoreResignation(onlineYourColor);
    }

    resetGameLocally();
}

export function resetGameLocally() {
    if (isOnlineMatch && onlineGameColorType === 'random') {
        const newColor = oppositeColor(onlineYourColor);
        setOnlineAttributes(onlineOpponentName, 
            newColor, onlineYourName, onlineStartClockMillis, onlineGameColorType);
    }

    setCanOfferDraw(true);

    resetBoard();
    resetGameStats();
    resetGameHistory();
    notationElem.innerHTML = getInitialNotationMessage();
    isPlaying = true;

    updateBoardPieces();
    updateMaterialCountDifference();

    resetPromotionSettings(isOnlineMatch ? onlineYourColor : 'white');
    playButtonElem.innerHTML = isOnlineMatch ? getResignGameIcon() : getRestartPlayAgainIcon();
    playSound('start');
}

function setUpModalSettings() {
    var modalWindowElem = document.querySelector(".settings-modal");
    var settingsButtonElem = document.querySelector(".js-settings-button");
    var closeSpanElem = document.getElementsByClassName("close")[0];

    settingsButtonElem.onclick = function() {
        modalWindowElem.style.display = "block";
    }

    closeSpanElem.onclick = function() {
        modalWindowElem.style.display = "none";
    }

    modalWindowElem.onclick = function(event) {
        if (event.target == modalWindowElem) {
            modalWindowElem.style.display = "none";
        }
    }
}

export function getResignGameIcon() {
    return `<img src="images/icons/resign_icon.png" class="icon">
        <div class="tooltip-text">Resign Game</div>`
}

export function getRestartPlayAgainIcon() {
    return `<img src="images/icons/restart_play_again_icon.png" class="icon">
        <div class="tooltip-text">Restart Game</div>`;
}

export function getWelcomeMessage() {
    return `
    <ul class="welcome-message">
        <li class="welcome-message-line">Enter your name to challenge opponents online.</li>
        <li class="welcome-message-line">Choose your favorite time control in the settings.</li>
        <li class="welcome-message-line">Nobody around?<br> Press Play Offline (&#9658;).</li>
    </ul>`;
}

export function getInitialNotationMessage() {
    return `
    <ul class="welcome-message initial-notation-message">
        <li>Moves unfold here!</li>
        <li>Navigate through past positions by clicking on a move or pressing the arrow keys. &#8701; &#8702;</li>
    </ul>`
}

function resetPromotionSettings(color) {
    const colorCode = color === 'black' ? 'b' : 'w';
    const pieceSetName = 'maestro';
    const imageFormat = 'svg';
    promotionSettingsElem.innerHTML = `
        <img src="images/pieces/${pieceSetName}/${colorCode}p.${imageFormat}" class="promotion-piece-icon">
    <img src="images/icons/promotion_arrow_icon.png" class="promotion-piece-icon">
    
    <label>
        <input type="radio" id="promotion-queen" name="promotion" value="q" class="promotion-radio" checked>
        <img src="images/pieces/${pieceSetName}/${colorCode}q.${imageFormat}" class="promotion-piece-icon promotion-choice" alt="Queen">
    </label>
    <label>
        <input type="radio" id="promotion-knight" name="promotion" value="n" class="promotion-radio">
        <img src="images/pieces/${pieceSetName}/${colorCode}n.${imageFormat}" class="promotion-piece-icon promotion-choice" alt="Knight">
    </label>
    <label>
        <input type="radio" id="promotion-rook" name="promotion" value="r" class="promotion-radio">
        <img src="images/pieces/${pieceSetName}/${colorCode}r.${imageFormat}" class="promotion-piece-icon promotion-choice" alt="Rook">
    </label>
    <label>
        <input type="radio" id="promotion-bishop" name="promotion" value="b" class="promotion-radio">
        <img src="images/pieces/${pieceSetName}/${colorCode}b.${imageFormat}" class="promotion-piece-icon promotion-choice" alt="Bishop">
    </label>
    `;
}
