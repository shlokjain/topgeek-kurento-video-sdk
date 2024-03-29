import Room from 'Room';
import Model from './Model';

export default class Participant extends Model {
  name: string;
  displayName: string;
  room: Room;
  rtcPeer: any;
  track: any;
  screen: any;
  isScreenShared: boolean = false;
  constructor(name: string, displayName: string, room: Room) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.room = room;
    Object.defineProperty(this, 'rtcPeer', { writable: true });

    this.track = document.createElement('video');
    this.track.autoplay = true;
    this.track.controls = false;
    this.track.style.width = '100%';
    const mediaStream = new MediaStream();
    this.track.srcObject = mediaStream;

    this.track.style.background = 'black';

    // this.track.src =
    //   'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    this.screen = document.createElement('video');
    this.screen.id = name;
    this.screen.autoplay = true;
    this.screen.controls = false;
    this.screen.srcObject = null;

    // this.screen.srcObject = new MediaStream();
  }

  dispose() {
    this.rtcPeer.dispose();
  }

  getVideoElement() {
    return this.track;
  }

  getScreenElement() {
    return this.screen;
  }

  setScreenSharing(value: boolean) {
    this.isScreenShared = value;
  }

  stopMedia = (k: any) => {
    this.track.srcObject.getTracks().map((t: any) => {
      console.log(t, 't here ');
      return t.kind == k && t.stop();
    });
  };
  setAudio(value: boolean) {
    this.rtcPeer.audioEnabled = value;
    // this.stopMedia('audio');
    this.emit('audio', value);
  }
  setVideo(value: boolean) {
    // if (value == false) {
    //   this.stopMedia('video');
    // } else {
    //   this.startMedia('video');
    // }
    this.rtcPeer.videoEnabled = value;
    this.emit('video', value);
  }
}
