import { initializeBoard, updateBoardPieces, notationElem, resetBoard, flipBoard, updateScoreResignation, oppositeColor } from "./board.js";
import { findMatch, disconnectFromServer, resignOnlineGame, sendDrawOffer, setCanOfferDraw } from "./client.js";
import { resetGameHistory, resetGameStats } from "./stats.js";
import { addLogMessage, isOnlineMatch, onlineGameColorType, onlineOpponentName, onlineStartClockMillis, onlineYourColor, onlineYourName, setOnlineAttributes } from "./online.js"

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
playButtonElem.addEventListener('click', resetGameCompletely);
findMatchButtonElem.addEventListener('click', findMatch);
disconectButtonElem.addEventListener('click', () => {
    updateScoreResignation(onlineYourColor);
    disconnectFromServer();
});
flipBoardButtonElem.addEventListener('click', flipBoard);
drawOfferButtonElem.addEventListener('click', () => {
    if (isOnlineMatch) {
        sendDrawOffer();
    } else {
        addLogMessage('No draw offers in singleplayer.');
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

    resetPromotionSettings(isOnlineMatch ? onlineYourColor : 'white');
    playButtonElem.innerHTML = isOnlineMatch ? getResignGameIcon() : getRestartPlayAgainIcon();
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
    return '<img src="images/icons/resign_icon.png" class="icon">'
}

export function getRestartPlayAgainIcon() {
    return '<img src="images/icons/restart_play_again_icon.png" class="icon">';
}

export function getWelcomeMessage() {
    return `
    <ul class="welcome-message">
        <li class="welcome-message-line">Enter your name to challenge opponents online.</li>
        <li class="welcome-message-line">Choose your favorite time control in the settings.</li>
        <li class="welcome-message-line">Nobody around? Dive into singleplayer mode. (&#9658;)</li>
    </ul>`;
}

export function getInitialNotationMessage() {
    return `
    <ul class="welcome-message initial-notation-message">
        <li>Moves unfold here!</li>
    </ul>`
}

function resetPromotionSettings(color) {
    const colorCode = color === 'black' ? 'b' : 'w';
    promotionSettingsElem.innerHTML = `
        <img src="images/pieces/space/${colorCode}p.png" class="promotion-piece-icon">
    <img src="images/icons/promotion_arrow_icon.png" class="promotion-piece-icon">
    
    <label>
        <input type="radio" id="promotion-queen" name="promotion" value="q" class="promotion-radio" checked>
        <img src="images/pieces/space/${colorCode}q.png" class="promotion-piece-icon promotion-choice" alt="Queen">
    </label>
    <label>
        <input type="radio" id="promotion-knight" name="promotion" value="n" class="promotion-radio">
        <img src="images/pieces/space/${colorCode}n.png" class="promotion-piece-icon promotion-choice" alt="Knight">
    </label>
    <label>
        <input type="radio" id="promotion-rook" name="promotion" value="r" class="promotion-radio">
        <img src="images/pieces/space/${colorCode}r.png" class="promotion-piece-icon promotion-choice" alt="Rook">
    </label>
    <label>
        <input type="radio" id="promotion-bishop" name="promotion" value="b" class="promotion-radio">
        <img src="images/pieces/space/${colorCode}b.png" class="promotion-piece-icon promotion-choice" alt="Bishop">
    </label>
    `;
}
