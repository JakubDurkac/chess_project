import { wasCastling } from "./board.js";
import { isAttackedSquare } from "./logic.js";
import { gameStats } from "./stats.js";

const volumeControlElem = document.getElementById('volume-control');

const playerMoveSoundElem = document.getElementById('player-move-sound');
const captureSoundElem = document.getElementById('capture-sound');
const castleSoundElem = document.getElementById('castle-sound');
const checkSoundElem = document.getElementById('check-sound');
const startSoundElem = document.getElementById('start-sound');
const endSoundElem = document.getElementById('end-sound');

const soundNameToElem = {
    'move': playerMoveSoundElem,
    'capture': captureSoundElem,
    'castle': castleSoundElem,
    'check': checkSoundElem,
    'start': startSoundElem,
    'end': endSoundElem
};

export function playSound(soundName) {
    const soundElem = soundNameToElem[soundName];
    
    if (soundElem) { 
        soundElem.volume = volumeControlElem ? volumeControlElem.value : 0.5; 
        soundElem.play();
    }
}

export function makeSoundBasedOnLastMove() {
    const {lastMove, kingCoords} = gameStats;
    const {fromCoords, toCoords, piece, pieceTaken, isWhite} = lastMove;
    let soundName = 'move';

    const opponentColor = isWhite ? 'black' : 'white';
    const opponentKingCoords = kingCoords[opponentColor];
    if (isAttackedSquare(opponentKingCoords[0], opponentKingCoords[1], opponentColor.charAt(0))) {
        soundName = 'check';
    } else if (wasCastling(fromCoords, toCoords, piece)) {
        soundName = 'castle';
    } else if (pieceTaken) {
        soundName = 'capture';
    }

    playSound(soundName);
}
