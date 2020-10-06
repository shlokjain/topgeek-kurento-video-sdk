import Room from 'Room';
import Model from './Model';

export default class Participant extends Model {
  name: string;
  room: Room;
  rtcPeer: any;
  track: any;
  screen: any;
  isScreenShared: boolean = false;
  constructor(name: string, room: Room) {
    super();
    this.name = name;
    this.room = room;
    Object.defineProperty(this, 'rtcPeer', { writable: true });

    console.log(name, 'name here');
    this.track = document.createElement('video');
    this.track.autoplay = true;
    this.track.controls = false;
    this.track.style.width = '100%';
    const mediaStream = new MediaStream();
    this.track.srcObject = mediaStream;

    this.screen = document.createElement('video');
    this.screen.id = 'screen-' + name;
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
    this.emit('isScreenShared', value);
  }

  setAudio(value: boolean) {
    this.rtcPeer.audioEnabled = value;
    this.emit('audio', value);
  }
  setVideo(value: boolean) {
    this.rtcPeer.videoEnabled = value;
    this.emit('video', value);
  }
}
