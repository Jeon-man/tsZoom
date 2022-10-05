"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
const socket = (0, socket_io_client_1.io)();
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");
call.hidden = true;
let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
function getCamera() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const devices = yield navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter((devices) => devices.kind === "videoinput");
            const currentCamera = myStream.getVideoTracks()[0];
            cameras.forEach((camera) => {
                const option = document.createElement("option");
                option.value = camera.deviceId;
                option.innerText = camera.label;
                if (currentCamera.label == camera.label) {
                    option.selected = true;
                }
                camerasSelect.appendChild(option);
            });
        }
        catch (e) {
            console.log(e);
        }
    });
}
function getMedia(deviceId) {
    return __awaiter(this, void 0, void 0, function* () {
        const initialConstrains = {
            audio: true,
            video: { facingMode: "user" },
        };
        const cameraConstrains = {
            audio: true,
            video: { deviceId: { exact: deviceId } },
        };
        try {
            myStream = yield navigator.mediaDevices.getUserMedia(deviceId ? cameraConstrains : initialConstrains);
            myFace.srcObject = myStream;
            if (!deviceId) {
                yield getCamera();
            }
        }
        catch (e) {
            console.log(e);
        }
    });
}
muteBtn.addEventListener("click", () => {
    myStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if (!muted) {
        muteBtn.innerText = "UnMute";
        muted = true;
    }
    else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
});
cameraBtn.addEventListener("click", () => {
    myStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if (!cameraOff) {
        cameraBtn.innerText = "Turn camera Off";
        cameraOff = false;
    }
    else {
        cameraBtn.innerHTML = "Turn camera On";
        cameraOff = true;
    }
});
function handleCameraChange() {
    return __awaiter(this, void 0, void 0, function* () {
        yield getMedia(camerasSelect.value);
    });
}
camerasSelect.addEventListener("input", handleCameraChange);
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
function startMedia() {
    return __awaiter(this, void 0, void 0, function* () {
        welcome.hidden = true;
        call.hidden = false;
        yield getMedia();
        makeConnection();
    });
}
function handleWelcome(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    socket.emit("join_room", input.value, startMedia);
    roomName = input.value;
    input.value = "";
}
welcomeForm.addEventListener("submit", handleWelcome);
//socket
socket.on("welcome", () => __awaiter(void 0, void 0, void 0, function* () {
    const offer = yield myPeerConnection.creatOffer();
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName);
}));
socket.on("offer", (offer) => { });
// RTC
function makeConnection() {
    myPeerConnection = new RTCPeerConnection();
    myStream
        .getTrack()
        .forEach((track) => myPeerConnection.addTrack(track, myStream));
}
