import Room from './Room';
import socketIOClient from 'socket.io-client';
import kurentoUtils from 'kurento-utils';
import Participant from './Participant';
import { find, isNil } from 'lodash';

var socket: any;

class Video {
  socket: any;
  room: Room;
  screenShare: any;
  currentParticipantName: string;
  config: {
    url: string;
    name: string;
    roomName: string;
    videoEnabled: boolean;
    audioEnabled: boolean;
  };

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
      recording?: boolean;
    }
  ) {
    this.config = config;
    socket = socketIOClient(config.url, {
      query: `accessToken=${token}`,
    });
    this.currentParticipantName = config.name;
    socket.on('error', function(data: any) {
      console.error('Socket Error', data);
    });
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
          this.onNewParticipant(parsedMessage);
          break;

        case 'newScreenShared':
          console.log(parsedMessage.id, '@@@@', parsedMessage);
          this.onNewScreenShared(parsedMessage);
          break;
        case 'screenShared':
          console.log(parsedMessage.id, '@@@@', parsedMessage);
          this.onScreenShared(parsedMessage);
          break;
        case 'screenSharingStarted':
          {
            // const participant: any = this.room.participants.get(
            //   parsedMessage.name
            // );

            // console.log(
            //   'hello here here *************',
            //   participant,
            //   parsedMessage.name
            // );

            if (this.currentUser) {
              this.currentUser.setScreenSharing(true);
              this.room.emit('isScreenShared', {
                user: this.currentUser,
                value: true,
              });
            }
          }
          break;

        case 'screenSharingStopped':
          {
            // const participant: any = this.room.participants.get(
            //   parsedMessage.name
            // );
            if (this.currentUser) {
              this.currentUser.setScreenSharing(false);
              this.room.emit('isScreenShared', {
                user: this.currentUser,
                value: false,
              });
            }
          }
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
        case 'setAudio':
          {
            const participant = this.room.participants.get(parsedMessage.name);
            if (participant) {
              participant.setAudio(parsedMessage.value);
            }
          }
          break;
        case 'setVideo':
          {
            const participant = this.room.participants.get(parsedMessage.name);

            if (participant) {
              participant.setVideo(parsedMessage.value);

              // participant.setVideo(parsedMessage.value);
              // participant.track.srcObject.getTracks().map((t: any) => {
              //   return t.kind == 'video' && t.stop();
              // });
            } else {
              // this.setMedia(participant, 'video', parsedMessage.value);
            }
          }
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
          recording: config.recording,
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
    console.log(participant, 'participant here');
    if (error) return console.error('sdp offer error');
    var msg = {
      id: 'receiveVideoFrom',
      sender: participant.name,
      sdpOffer: offerSdp,
    };
    socket.emit('message', msg);
  }
  offerToReceiveScreen(participant: any, error: any, offerSdp: any, wp: any) {
    if (error) return console.error('sdp offer error');
    var msg = {
      id: 'receiveScreenFrom',
      sender: participant.name,
      sdpOffer: offerSdp,
    };
    socket.emit('message', msg);
  }

  onIceCandidate = (participant: any, candidate: any, wp: any) => {
    console.log('hello here on new sceen 2222');
    var message = {
      id: 'onIceCandidate',
      candidate: candidate,
      sender: participant.name,
    };
    socket.emit('message', message);
  };

  onIceCandidateScreen = (participant: any, candidate: any, wp: any) => {
    var message = {
      id: 'onIceCandidateScreen',
      candidate: candidate,
      sender: participant.name,
    };
    socket.emit('message', message);
  };

  receiveVideoResponse(result: any) {
    const participant = this.room.participants.get(result.name);

    console.log(result.name, result.sdpAnswer, 'ans wer here');

    if (participant) {
      participant.rtcPeer.processAnswer(result.sdpAnswer, function(error: any) {
        if (error) return console.error(error);
      });
      participant.emit('receiveVideo', participant);
    }
  }

  onNewScreenShared(request: any) {
    var participant = new Participant('Screen-' + request.name, this.room);

    if (this.room) {
      var video = participant.getVideoElement();
      var options = {
        remoteVideo: video,
        onicecandidate: this.onIceCandidate.bind(participant, participant),
      };

      console.log('hello here on new sceen');
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
          this.room.connectParticipant(participant);
        }
      );
    }
  }

  onScreenShared(request: any) {
    var constraints: any = {
      audio: false,
      video: {
        mandatory: {
          maxWidth: 1280,
          maxHeight: 720,
          maxFrameRate: 30,
          minFrameRate: 15,
        },
      },
    };
    let name = request.name;
    if (this.room) {
      var participant = new Participant('_' + name, this.room);
      var video = participant.getVideoElement();

      // var videoScreen = participant.getScreenElement();
      let video_el = this.screenShare; //
      // docume/nt.getElementById('share-_video');
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
          // participant.rtcPeer.generateOffer(
          //   this.offerToReceiveVideo.bind(participant, participant)
          // );

          // participant.rtcPeer.videoEnabled = true;
          // participant.rtcPeer.audioEnabled = true;
          // if (!this.config.videoEnabled) {
          //   participant.rtcPeer.videoEnabled = false;
          // }
          // if (!this.config.audioEnabled) {
          //   participant.rtcPeer.audioEnabled = false;
          // }

          this.room.connectParticipant(participant);
        }
      );

      // request.data.forEach(this.onNewScreenShared);
    }
  }
  onNewParticipant(request: any) {
    console.log('request name new', request.name);
    this.receiveVideo(request.name);
  }

  onExistingParticipants(request: any) {
    console.log('request name', request.name);
    var constraints: any = {
      audio: true,
      video: {
        mandatory: {
          maxWidth: 1280,
          maxHeight: 720,
          maxFrameRate: 30,
          minFrameRate: 15,
        },
      },
    };
    let name = request.name;
    if (this.room) {
      var participant = new Participant(name, this.room);
      var video = participant.getVideoElement();

      // var videoScreen = participant.getScreenElement();
      let video_el = this.screenShare; //
      // docume/nt.getElementById('share-_video');

      var video = participant.getVideoElement();
      video.srcObject = video_el.srcObject;
      var options = {
        localVideo: video,
        videoStream: video_el.srcObject,
        mediaConstraints: constraints,
        onicecandidate: this.onIceCandidate.bind(participant, participant),
        // sendSource: 'desktop',
      };

      // if (this.currentUser === participant) {
      //   if (this.config.videoEnabled === false) {
      //     options.mediaConstraints.video = false;
      //   }
      //   if (this.config.audioEnabled === false) {
      //     options.mediaConstraints.audio = false;
      //   }
      // }
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

          if (!name.startsWith('Screen-')) {
            participant.rtcPeer.videoEnabled = true;
            participant.rtcPeer.audioEnabled = true;
            if (!this.config.videoEnabled) {
              participant.rtcPeer.videoEnabled = false;
            }
            if (!this.config.audioEnabled) {
              participant.rtcPeer.audioEnabled = false;
            }
          }

          this.room.connectParticipant(participant);
        }
      );
      request.data.forEach(this.receiveVideo);
    }

    // }
  }

  setAudio = (value: boolean) => {
    // if (this.currentUser) {
    //   var msg = {
    //     id: 'setAudio',
    //     sender: this.currentUser.name,
    //     value: value,
    //     roomName: this.room.name,
    //   };
    //   socket.emit('message', msg);
    // }

    if (this.currentUser) {
      const participant = this.room.participants.get(this.currentUser.name);
      if (participant) {
        participant.setAudio(value);
      }
    }
  };
  setVideo(value: boolean) {
    // if (this.currentUser) {
    //   var msg = {
    //     id: 'setVideo',
    //     sender: this.currentUser.name,
    //     value: value,
    //     roomName: this.room.name,
    //   };
    //   socket.emit('message', msg);
    // }

    if (this.currentUser) {
      const participant = this.room.participants.get(this.currentUser.name);

      if (participant) {
        participant.setVideo(value);

        // participant.setVideo(parsedMessage.value);
        // participant.track.srcObject.getTracks().map((t: any) => {
        //   return t.kind == 'video' && t.stop();
        // });
      } else {
        // this.setMedia(participant, 'video', parsedMessage.value);
      }
    }
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
  stopScreenSharing() {
    var message = {
      id: 'stopScreenSharing',
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
    let displayMediaOptions = {
      video: {
        width: { ideal: 1280, max: 1280 },
        height: { ideal: 720, max: 720 },
      },
      audio: false,
    };

    navigator.mediaDevices['getDisplayMedia'](displayMediaOptions)
      .then((stream: any, data: any) => {
        console.log(stream, data, 'all here');
        const participant = this.room.participants.get(
          this.currentParticipantName
        );
        if (participant) {
          let video_el = this.screenShare; //document.getElementById('share-_video');
          video_el.srcObject = stream;

          var message = {
            id: 'screenShare',
            name: this.currentParticipantName,
            roomName: this.room.name,
          };
          socket.emit('message', message);
        }
      })
      .catch((error: any) => {
        console.log(error);
      });
  }

  receiveVideo = (name: any) => {
    var participant = new Participant(name, this.room);

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

          if (isNil(participant.rtcPeer.audioEnabled)) {
            participant.rtcPeer.audioEnabled = true;
          }
          if (isNil(participant.rtcPeer.videoEnabled)) {
            participant.rtcPeer.videoEnabled = true;
          }

          this.room.connectParticipant(participant);
        }
      );
    }

    // var video = participant.getScreenElement();
    // let video = document.getElementById("share-_video");
    // let video_el = document.getElementById("share-_video");
  };

  onParticipantLeft(request: any) {
    const participant = this.room.participants.get(request.name);
    if (participant) this.room.removeParticipant(participant);
  }

  setMedia(participant: any, k: any, value: boolean) {
    // if (!value) {
    //   participant.track.srcObject.getTracks().map((t: any) => {
    //     return t.kind == k && t.stop();
    //   });
    // } else {
    // if (this.currentUser === participant) {
    participant = participant
      ? participant
      : new Participant(this.currentParticipantName, this.room);

    var constraints: any = {
      audio: true,
      video: {
        mandatory: {
          maxWidth: 1280,
          maxHeight: 720,
          maxFrameRate: 30,
          minFrameRate: 15,
        },
      },
    };
    if (this.room) {
      var video = participant.getVideoElement();
      let video_el = this.screenShare; //

      video.srcObject = video_el.srcObject;
      var options = {
        localVideo: video,
        // videoStream: video_el.srcObject,
        mediaConstraints: constraints,
        onicecandidate: this.onIceCandidate.bind(participant, participant),
        // sendSource: 'desktop',
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

          participant.rtcPeer.videoEnabled = true;
          participant.rtcPeer.audioEnabled = true;
          if (!this.config.videoEnabled) {
            participant.rtcPeer.videoEnabled = false;
          }
          if (!this.config.audioEnabled) {
            participant.rtcPeer.audioEnabled = false;
          }
          this.room.connectParticipant(participant);
        }
      );
      // }
      // }
    }
  }
}

export default Video;
