import Room from './Room';
import socketIOClient from 'socket.io-client';
import kurentoUtils from 'kurento-utils';
import Participant from './Participant';
import { find } from 'lodash';

var socket: any;

class Video {
  socket: any;
  room: Room;
  screenShare: any;
  currentParticipantName: string;

  constructor() {
    //
    this.screenShare = document.createElement('video');
    this.screenShare.id = 'screenShare';
    this.screenShare.autoplay = true;
    this.screenShare.controls = false;
    this.screenShare.srcObject = null;
  }
  sendMessage = (message: any) => {
    socket.emit('message', message);
  };

  get currentUser() {
    if (this.room) {
      const user = this.room.participants.get(this.currentParticipantName);
      return user;
    }
    return;
  }
  connect(
    token: string,
    config: {
      url: string;
      name: string;
      roomName: string;
      videoEnabled: boolean;
      audioEnabled: boolean;
    }
  ) {
    console.log('video sdk connect here');
    socket = socketIOClient(config.url);

    this.currentParticipantName = config.name;

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

        case 'participantLeft':
          this.onParticipantLeft(parsedMessage);
          break;

        case 'receiveVideoAnswer':
          this.receiveVideoResponse(parsedMessage);
          break;
        case 'reply':
          this.room.emit('speak', parsedMessage);
          console.log(parsedMessage, 'reply on event');
          break;

        case 'recordingStarted':
          this.room.recording = true;
          this.room.emit('recording', true);
          break;

        case 'recordingStopped':
          this.room.recording = false;
          this.room.emit('recording', false);
          break;
        case 'receiveText':
          this.room.messages.push(parsedMessage);
          this.room.emit('receiveText', parsedMessage);
          break;
        case 'joinedRoom':
          this.room.messages = parsedMessage.messages;
          this.room.emit('connected', this.room);
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
          videoEnabled: config.videoEnabled,
          audioEnabled: config.videoEnabled,
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
    if (participant) {
      participant.rtcPeer.processAnswer(result.sdpAnswer, function(error: any) {
        if (error) return console.error(error);
      });
      participant.emit('receiveVideo', participant);
    }
  }

  onNewParticipant(request: any) {
    console.log('request name new', request.name);

    this.receiveVideo(request.name);
  }

  onExistingParticipants(request: any) {
    console.log('request name', request.name);
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
      var participant = new Participant(name, this.room);
      this.room.connectParticipant(participant);
      var video = participant.getVideoElement();

      // var videoScreen = participant.getScreenElement();
      let video_el = this.screenShare; //
      // docume/nt.getElementById('share-screen-video');

      var video = participant.getVideoElement();
      var options = {
        localVideo: video,
        videoStream: video_el.srcObject,
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

  onPlayOffer = (error: any, offer: any) => {
    console.log('playe ere');
    if (error) {
      console.log(error, 'error here');
      return;
    }

    if (error) return console.error('sdp offer error');
    var msg = {
      id: 'onPlay',
      sender: 'player',
      sdpOffer: offer,
    };
    socket.emit('message', msg);

    // kurentoClient(args.ws_uri, function(error, client) {
    //   if (error) {
    //     console.log(error, 'error here');
    //     return;
    //   }

    //   client.create('MediaPipeline', function(error, pipeline) {
    //     if (error) {
    //       console.log(error, 'error here');
    //       return;
    //     }

    //     pipeline.create('WebRtcEndpoint', function(error, webRtc) {
    //       if (error) {
    //         console.log(error, 'error here');
    //         return;
    //       }

    //       setIceCandidateCallbacks(webRtcPeer, webRtc, onError);

    //       webRtc.processOffer(offer, function(error, answer) {
    //         if (error) return onError(error);

    //         webRtc.gatherCandidates(onError);

    //         webRtcPeer.processAnswer(answer);
    //       });

    //       var options = { uri: args.file_uri };

    //       pipeline.create('PlayerEndpoint', options, function(error, player) {
    //         if (error) return onError(error);

    //         player.on('EndOfStream', function(event) {
    //           pipeline.release();
    //           videoPlayer.src = '';

    //           hideSpinner(videoPlayer);
    //         });

    //         player.connect(webRtc, function(error) {
    //           if (error) return onError(error);

    //           player.play(function(error) {
    //             if (error) return onError(error);
    //             console.log('Playing ...');
    //           });
    //         });

    //         // document
    //         //   .getElementById('stop')
    //         //   .addEventListener('click', function(event) {
    //         //     pipeline.release();
    //         //     webRtcPeer.dispose();
    //         //     videoPlayer.src = '';

    //         //     hideSpinner(videoPlayer);
    //         //   });
    //       });
    //     });
    //   });
    // });
  };

  startPlaying = () => {
    console.log('Start playing');

    var message = {
      id: 'onPlay',
      name: 'Player-1',
      roomName: this.room.name,
    };

    socket.emit('message', message);

    return;

    var videoPlayer = document.getElementById('videoOutput');
    var options = {
      remoteVideo: videoPlayer,
    };

    // if (args.ice_servers) {
    //   console.log("Use ICE servers: " + args.ice_servers);
    //   options.configuration = {
    //     iceServers: JSON.parse(args.ice_servers),
    //   };
    // } else {
    //   console.log("Use freeice");
    // }

    var webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(
      options,
      error => {
        if (error) {
          console.log('Error here: ', error);
          return;
        }

        webRtcPeer.generateOffer(this.onPlayOffer);
      }
    );
  };

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

  record() {
    var message = {
      id: 'record',
      name: this.currentParticipantName,
      roomName: this.room.name,
    };

    socket.emit('message', message);
  }

  sendTextToRoom(text: any) {
    var message = {
      id: 'sendTextToRoom',
      name: this.currentParticipantName,
      roomName: this.room.name,
      text: text,
    };

    socket.emit('message', message);
  }
  stopRecording() {
    var message = {
      id: 'stopRecording',
      name: this.currentParticipantName,
      roomName: this.room.name,
    };

    socket.emit('message', message);
  }
  shareScreen() {
    console.log('hello here');
    // var audioConstraints = {
    //   audio: false,
    //   video: true,
    // };
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
    let displayMediaOptions = { video: true, audio: false };

    // navigator.mediaDevices.getUserMedia

    navigator.mediaDevices['getDisplayMedia'](displayMediaOptions)
      .then((stream: any) => {
        const participant = this.room.participants.get(
          this.currentParticipantName
        );
        if (participant) {
          let video_el = this.screenShare; //document.getElementById('share-screen-video');
          video_el.srcObject = stream;

          var message = {
            id: 'screenShare',
            name: this.currentParticipantName,
            roomName: this.room.name,
          };

          socket.emit('message', message);
        }
        // let video_el = document.getElementById('share-screen-video');
      })
      .catch((error: any) => {
        console.log(error);
      });
  }

  receiveVideo = (name: any) => {
    var participant = new Participant(name, this.room);
    this.room.connectParticipant(participant);

    if (this.room) {
      var video = participant.getVideoElement();

      // if (name.startsWith('Screen-')) {
      //   video = participant.getScreenElement();
      // }
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
