import Room from './Room';
import socketIOClient from 'socket.io-client';
import kurentoUtils from 'kurento-utils';
import Participant from './Participant';
const ENDPOINT = 'https://localhost:3000/';

var socket: any;
class Video {
  socket: any;
  room: Room;

  constructor() {
    //
  }
  sendMessage = (message: any) => {
    socket.emit('message', message);
  };

  connect(
    token: string,
    config: {
      url: string;
      name: string;
      roomName: string;
    }
  ) {
    socket = socketIOClient(ENDPOINT);

    socket.on('event', function(data: any) {
      console.log('connected on event', data);
    });

    socket.on('disconnect', function(data: any) {
      console.log('disconnected on event', data);
    });

    socket.on('message', (parsedMessage: any) => {
      console.log(parsedMessage, 'message');
      switch (parsedMessage.id) {
        case 'existingParticipants':
          console.log(parsedMessage.id, '*****', parsedMessage.name);
          this.onExistingParticipants(parsedMessage);
          break;

        case 'newParticipantArrived':
          console.log(parsedMessage.id, '*****', parsedMessage.name);

          this.onNewParticipant(parsedMessage);
          break;
        // case "screenShare":
        //   onScreenShare(parsedMessage);
        //   break;
        case 'participantLeft':
          this.onParticipantLeft(parsedMessage);
          break;

        case 'receiveVideoAnswer':
          this.receiveVideoResponse(parsedMessage);
          break;
        case 'iceCandidate':
          // console.log('zzzzzzz');
          const participant = this.room.participants.get(parsedMessage.name);
          if (participant) {
            participant.rtcPeer.addIceCandidate(
              parsedMessage.candidate,
              function(error: any) {
                if (error) {
                  console.error('Error adding candidate: ' + error);
                  return;
                }
              }
            );
          }
          break;
      }
    });

    return new Promise((resolve, reject) => {
      socket.on('connect', () => {
        var message = {
          id: 'joinRoom',
          name: config.name,
          roomName: config.roomName,
        };
        this.sendMessage(message);
        this.room = new Room(config.roomName);
        resolve(this.room);
      });

      socket.on('disconnect', function(data: any) {
        console.log('disconnected on event', data);
        reject('Disconnected');
      });
    });
  }

  // function onScreenShare(msg) {
  //   let constraints = {
  //     video: {
  //       mandatory: {
  //         maxWidth: 320,
  //         maxFrameRate: 15,
  //         minFrameRate: msg.existingParticipants,
  //       },
  //     },
  //     audio: false,
  //   };

  //   var localParticipant = participants[msg.name];
  //   // participants[msg.name] = localParticipant;
  //   let video_el = document.getElementById('share-screen-video');

  //   var video = video_el;
  //   var options = {
  //     remoteVideo: video,
  //     // videoStream: video_el.srcObject,
  //     // mediaConstraints: constraints,
  //     onicecandidate: localParticipant.onIceCandidate.bind(localParticipant),
  //   };

  //   localParticipant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(
  //     options,
  //     function(error) {
  //       if (error) {
  //         return console.error(error);
  //       }
  //       // Set localVideo to new object if on IE/Safari
  //       // localVideo = document.getElementById("local_video");
  //       // // initial main video to local first
  //       // localVideoCurrentId = sender;
  //       // //localVideo.src = localParticipant.rtcPeer.localVideo.src;
  //       // localVideo.muted = true;
  //       // console.log("local participant id : " + sender);
  //       this.generateOffer(
  //         localParticipant.offerToReceiveVideo.bind(localParticipant)
  //       );
  //     }
  //   );

  //   console.log();
  //   // msg.data.forEach(receiveVideo);
  // }

  offerToReceiveVideo(participant: any, error: any, offerSdp: any, wp: any) {
    if (error) return console.error('sdp offer error');
    var msg = {
      id: 'receiveVideoFrom',
      sender: participant.name,
      sdpOffer: offerSdp,
    };
    socket.emit('message', msg);
  }

  onIceCandidate = (participant: any, candidate: any, wp: any) => {
    var message = {
      id: 'onIceCandidate',
      candidate: candidate,
      sender: participant.name,
    };
    socket.emit('message', message);
  };

  receiveVideoResponse(result: any) {
    const participant = this.room.participants.get(result.name);

    console.log(participant, 'hello here 222');
    if (participant) {
      participant.rtcPeer.processAnswer(result.sdpAnswer, function(error: any) {
        if (error) return console.error(error);
      });
    }
  }

  onNewParticipant(request: any) {
    this.receiveVideo(request.name);
  }

  onExistingParticipants(request: any) {
    var constraints = {
      audio: true,
      video: {
        mandatory: {
          maxWidth: 320,
          maxFrameRate: 15,
          minFrameRate: request.existingParticipants,
        },
      },
    };
    let name = request.name;
    if (this.room) {
      var participant = new Participant(name);
      this.room.connectParticipant(participant);
      var video = participant.getVideoElement();
      // let video_el = document.getElementById('share-screen-video');
      var options = {
        localVideo: video,
        // videoStream: video_el.srcObject,
        mediaConstraints: constraints,
        onicecandidate: this.onIceCandidate.bind(participant, participant),
      };
      //@ts-ignore
      participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(
        options,
        error => {
          if (error) {
            return console.error(error);
          }
          participant.rtcPeer.generateOffer(
            this.offerToReceiveVideo.bind(participant, participant)
          );
        }
      );
      request.data.forEach(this.receiveVideo);
    }

    // }
  }

  leaveRoom = () => {
    this.sendMessage({
      id: 'leaveRoom',
    });
    const participants = this.room.participants;

    participants.forEach(participant => {
      this.room.removeParticipant(participant);
    });
    socket.close();
  };

  shareScreen() {
    // console.log('hello here');
    // // var audioConstraints = {
    // //   audio: false,
    // //   video: true,
    // // };
    // var audioConstraints = {
    //   audio: false,
    //   video: {
    //     mandatory: {
    //       chromeMediaSource: 'desktop',
    //       maxWidth: 1920,
    //       maxHeight: 1080,
    //     },
    //     optional: [
    //       {
    //         googTemporalLayeredScreencast: true,
    //       },
    //     ],
    //   },
    // };
    // let displayMediaOptions = { video: true, audio: false };
    // navigator.mediaDevices
    //   .getDisplayMedia(displayMediaOptions)
    //   .then(function(stream) {
    //     let video_el = document.getElementById('share-screen-video');
    //     // video_el.style.display = "block";
    //     video_el.srcObject = stream;
    //     const sender = 'screen';
    //     var constraints = {
    //       audio: true,
    //       video: {
    //         mandatory: {
    //           maxWidth: 320,
    //           maxFrameRate: 15,
    //         },
    //       },
    //     };
    //     var message = {
    //       id: 'screenShare',
    //       name: sender,
    //       username: name,
    //       roomName: roomName,
    //       // srcObject: stream,
    //     };
    //     this.sendMessage(message);
    //   });
  }

  receiveVideo = (name: any) => {
    var participant = new Participant(name);
    this.room.connectParticipant(participant);

    if (this.room) {
      var video = participant.getVideoElement();
      var options = {
        remoteVideo: video,
        onicecandidate: this.onIceCandidate.bind(participant, participant),
      };
      //@ts-ignore
      participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(
        options,
        error => {
          if (error) {
            return console.error(error);
          }
          participant.rtcPeer.generateOffer(
            this.offerToReceiveVideo.bind(participant, participant)
          );
        }
      );
    }
    // var video = participant.getScreenElement();
    // let video = document.getElementById("share-screen-video");
    // let video_el = document.getElementById("share-screen-video");
  };

  onParticipantLeft(request: any) {
    const participant = this.room.participants.get(request.name);
    if (participant) this.room.removeParticipant(participant);
  }
}

export default Video;
