import { wasCastling } from "./board.js";
import { gameStats } from "./stats.js";

const volumeControlElem = document.getElementById('volume-control');

const playerMoveSoundElem = document.getElementById('player-move-sound');
const captureSoundElem = document.getElementById('capture-sound');
const castleSoundElem = document.getElementById('castle-sound');

const soundNameToElem = {
    'move': playerMoveSoundElem,
    'capture': captureSoundElem,
    'castle': castleSoundElem
};

export function playSound(soundName) {
    const soundElem = soundNameToElem[soundName];
    
    if (soundElem) { 
        soundElem.volume = volumeControlElem ? volumeControlElem.value : 0.5; 
        soundElem.play();
    }
}

export function makeSoundBasedOnLastMove() {
    const {lastMove} = gameStats;
    const {fromCoords, toCoords, piece, pieceTaken} = lastMove;
    let soundName = 'move';
    if (wasCastling(fromCoords, toCoords, piece)) {
        soundName = 'castle'
    } else if (pieceTaken) {
        soundName = 'capture';
    }

    playSound(soundName);
}
