import Model from './Model';

export default class Participant extends Model {
  name: string;
  rtcPeer: any;

  track: any;
  constructor(name: string) {
    super();
    this.name = name;
    Object.defineProperty(this, 'rtcPeer', { writable: true });

    console.log(name, 'name here');
    this.track = document.createElement('video');
    this.track.id = 'video-' + name;
    this.track.autoplay = true;
    this.track.controls = false;
    const mediaStream = new MediaStream();
    this.track.srcObject = mediaStream;
  }

  dispose() {
    this.rtcPeer.dispose();
  }

  getVideoElement() {
    return this.track;
  }
}
