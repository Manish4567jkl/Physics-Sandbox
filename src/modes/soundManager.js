import * as THREE from 'three';

let listener = null;
let sceneRef = null;  // Store scene reference to add/remove positional audio
const audioLoader = new THREE.AudioLoader();
const sounds = {};


export function initSoundSystem(camera, scene) {
    listener = new THREE.AudioListener();
    camera.add(listener);
    sceneRef = scene;
}

export function loadSound(name, path) {
    if (!listener) throw new Error("Call initSoundSystem(camera, scene) first");
    audioLoader.load(path, (buffer) => {
        sounds[name] = buffer;
    });
}

export function playSound(name) {
    if (!sounds[name]) return;

    const sound = new THREE.Audio(listener);
    sound.setBuffer(sounds[name]);
    sound.setVolume(0.7);
    if (sound.isPlaying) sound.stop();
    sound.setPlaybackRate(0.95 + Math.random() * 0.1);
    sound.play();
}

export function playPositionalSound(name, position) {
    if (!sounds[name] || !listener || !sceneRef) return;

    const sound = new THREE.PositionalAudio(listener);
    sound.setBuffer(sounds[name]);
    sound.setRefDistance(5);
    sound.setVolume(0.7);
    sound.setDistanceModel('linear');
    sound.setPlaybackRate(0.95 + Math.random() * 0.1);

    const soundObject = new THREE.Object3D();
    soundObject.position.copy(position);
    soundObject.add(sound);

    sceneRef.add(soundObject);
    sound.play();

    sound.source.onended = () => {
        sceneRef.remove(soundObject);
        soundObject.clear();
    };
}
