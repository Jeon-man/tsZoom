import { io, Socket } from "socket.io-client";

interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
  welcome: () => void;
  offer: (offer: any) => void;
}

interface ClientToServerEvents {
  hello: () => void;
  join_room: (roomName: string, done: any) => void;
  offer: (offer: any, roomName: string) => void;
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();

const myFace = document.getElementById("myFace") as HTMLVideoElement;
const muteBtn = document.getElementById("mute") as HTMLElement;
const cameraBtn = document.getElementById("camera") as HTMLElement;
const camerasSelect = document.getElementById("cameras") as HTMLSelectElement;

const call = document.getElementById("call") as HTMLDivElement;

call.hidden = true;

let myStream: any;
let muted: boolean = false;
let cameraOff: boolean = false;
let roomName: string;
let myPeerConnection: any;

async function getCamera() {
  try {
    const devices: MediaDeviceInfo[] =
      await navigator.mediaDevices.enumerateDevices();
    const cameras: MediaDeviceInfo[] = devices.filter(
      (devices) => devices.kind === "videoinput"
    );
    const currentCamera: MediaDeviceInfo = myStream.getVideoTracks()[0];
    cameras.forEach((camera: MediaDeviceInfo) => {
      const option = document.createElement("option") as HTMLOptionElement;
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label == camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId?: String): Promise<void> {
  const initialConstrains: Object = {
    audio: true,
    video: { facingMode: "user" },
  };

  const cameraConstrains: Object = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstrains : initialConstrains
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCamera();
    }
  } catch (e) {
    console.log(e);
  }
}

muteBtn.addEventListener("click", () => {
  myStream
    .getAudioTracks()
    .forEach((track: any) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "UnMute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
});

cameraBtn.addEventListener("click", () => {
  myStream
    .getVideoTracks()
    .forEach((track: any) => (track.enabled = !track.enabled));
  if (!cameraOff) {
    cameraBtn.innerText = "Turn camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerHTML = "Turn camera On";
    cameraOff = true;
  }
});

async function handleCameraChange(): Promise<void> {
  await getMedia(camerasSelect.value);
}

camerasSelect.addEventListener("input", handleCameraChange);

const welcome = document.getElementById("welcome") as HTMLDivElement;
const welcomeForm = welcome.querySelector("form") as HTMLFormElement;

async function startMedia(): Promise<void> {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

function handleWelcome(event: any) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input") as HTMLInputElement;
  socket.emit("join_room", input.value, startMedia);
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcome);

//socket
socket.on("welcome", async () => {
  const offer: any = await myPeerConnection.creatOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
});

socket.on("offer", (offer) => {});

// RTC

function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  myStream
    .getTrack()
    .forEach((track: any) => myPeerConnection.addTrack(track, myStream));
}
