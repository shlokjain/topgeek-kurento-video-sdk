import Room from './Room';
import socketIOClient from 'socket.io-client';
import kurentoUtils from 'kurento-utils';
import Participant from './Participant';
import { find, forEach, isNil, map } from 'lodash';
import Model from './Model';

const DEFAULT_VIDEO_CONSTRAINT = {
  width: { min: 352, ideal: 852, max: 852 },
  height: {
    min: 288,
    ideal: 480,
    max: 480,
  },
  frameRate: {
    max: 30,
    min: 15,
  },

  // mandatory: {
  // maxWidth: 1280,
  // maxHeight: 720,
  // maxFrameRate: 30,
  // minFrameRate: 15,
  // },
};
const DEFAULT_SCREEN_CONSTRAINT = {
  width: { min: 852, ideal: 1280, max: 1280 },
  height: { min: 480, ideal: 720, max: 720 },
  frameRate: {
    max: 30,
    min: 5,
  },

  // mandatory: {
  //   maxWidth: 1280,
  //   maxHeight: 720,
  //   maxFrameRate: 30,
  //   minFrameRate: 15,
  // },
};
var socket: any;
var handle: any;

class Video extends Model {
  socket: any;
  room: Room;
  screenShare: any;
  currentParticipantName: string;
  devices: Array<any> = [];
  config: {
    url: string;
    name: string;
    displayName: string;
    roomName: string;
    videoEnabled: boolean;
    audioEnabled: boolean;
    meta?: any;
  };
  private audioInputs: any = [];
  private videoInputs: any = [];
  private audioOutputs: any = [];
  private audioSource: any = 'default';
  private videoSource: any = true;

  private selectedAudioOutputDevice: any;

  constructor() {
    //
    super();
    this.screenShare = document.createElement('video');
    this.screenShare.id = 'screenShare';
    this.screenShare.autoplay = true;
    this.screenShare.controls = false;
    this.screenShare.srcObject = null;

    navigator.mediaDevices.enumerateDevices().then(devices => {
      for (let i = 0; i !== devices.length; ++i) {
        const deviceInfo = devices[i];
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput') {
          this.audioInputs.push(deviceInfo);
        } else if (deviceInfo.kind === 'audiooutput') {
          // audioOutputSelect.appendChild(option);
          this.audioOutputs.push(deviceInfo);
        } else if (deviceInfo.kind === 'videoinput') {
          this.videoInputs.push(deviceInfo);
        } else {
          console.log('Some other kind of source/device: ', deviceInfo);
        }
      }

      this.emit('devicesConnected', devices);
    });
  }

  sendMessage = (message: any) => {
    socket.emit('message', message);
  };

  getAudioOutputDevices = () => {
    //
    return this.audioOutputs;
  };

  getAudioInputDevices = () => {
    //
    return this.audioInputs;
  };

  getVideoInputDevices = () => {
    //
    return this.videoInputs;
  };

  selectAudioInputDevice = (device: any) => {
    //
    // const participants = this.room.participants;
    // forEach(participants, (participant: Participant) => {
    //   console.log(participant, 'participant');
    // });

    console.log();
    this.audioSource = device.deviceId;

    const participant = this.currentUser;

    if (!participant) {
      return;
    }

    this.setVideo(false);
    this.setVideo(true);

    // // this.stopStream(participant, 'audio');
    // this.stopStream(participant, 'video');

    // var msg = {
    //   id: 'setVideo',
    //   sender: participant.name,
    //   value: false,
    //   roomName: this.room.name,
    // };
    // socket.emit('message', msg);

    // // // // .then(resp => {
    // setTimeout(() => {
    //   this.startStream(participant);

    //   // var msg = {
    //   //   id: 'setVideo',
    //   //   sender: participant.name,
    //   //   value: false,
    //   //   roomName: this.room.name,
    //   // };
    //   // socket.emit('message', msg);
    // }, 5000);
    // })
  };
  selectVideoInputDevice = (deviceId: string) => {
    //
  };
  selectAudioOutputDevice = (device: any) => {
    //

    if (this.room) {
      const participants = this.room.participants;

      console.log(participants, 'participants');
      console.log(device.deviceId, 'device.deviceId');
      participants.forEach((participant: Participant) => {
        console.log(participant, device.deviceId, 'participant');
        participant.track
          .setSinkId(device.deviceId)
          .then(function() {
            console.log('hello here');
          })
          .catch((error: any) => {
            console.log(error, 'error here');
          });
      });
    }
    // this.selectedAudioOutputDevice = deviceId;
    // const element = document.getElementById('sample-video');
    // if (element) {
    //   //@ts-ignore
    //   element.setSinkId(deviceId).then(function() {
    //     console.log('hello here');
    //   });
    // }
  };
  startStream = (participant: any) => {
    var video = participant.getVideoElement();

    console.log(this.config.audioEnabled, this.audioSource, 'enabled aud');
    let video_el = this.screenShare;

    var options = {
      localVideo: video,
      // videoStream: video_el.srcObject,
      mediaConstraints: {
        video: this.config.videoEnabled ? DEFAULT_VIDEO_CONSTRAINT : false,
        audio: true,
        // audio: {
        //   deviceId: {
        //     exact:
        //       '545b3941ae6c6cdc43abd45ad803cb8e324dcc4afc7cef157303ae4004ad7f0e',
        //   },
        // },
        // audio: {
        //   deviceId: this.audioSource ? { exact: this.audioSource } : undefined,
        // },
        // video: {
        //   deviceId: this.videoSource ? { exact: this.videoSource } : undefined,
        // },

        // audio: {
        //   mandatory: {},
        //   optional: [
        //     {
        //       sourceId: this.audioSource
        //         ? { exact: this.audioSource }
        //         : undefined,
        //     },
        //   ],
        // },
        // video: {
        //   mandatory: {
        //     maxWidth: 1280,
        //     maxHeight: 720,
        //     maxFrameRate: 30,
        //     minFrameRate: 15,
        //   },
        //   // optional: [
        //   //   {
        //   //     sourceId: this.videoSource
        //   //       ? { exact: this.videoSource }
        //   //       : undefined,
        //   //   },
        //   // ],
        // },
      },
      onicecandidate: this.onIceCandidate.bind(
        participant,
        participant,
        this.currentParticipantName
      ),
    };
    console.log(options, 'enabled aud options');

    // participant.rtcPeer.dispose();
    //@ts-ignore
    participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(
      options,
      error => {
        if (error) {
          return console.error(error);
        }
        participant.rtcPeer.generateOffer(
          this.offerToReceiveVideo.bind(
            participant,
            participant,
            this.currentParticipantName
          )
        );

        participant.rtcPeer.videoEnabled = true;
        participant.rtcPeer.audioEnabled = true;

        if (!this.config.audioEnabled) {
          participant.rtcPeer.audioEnabled = false;
        }
      }
    );
    console.log(participant.rtcPeer, 'enabled aud rtcPeer');
  };

  stopStream = (participant: any, stream: 'audio' | 'video') => {
    const oldTrack = participant.track.srcObject.getTracks();
    oldTrack.map((t: any) => {
      return t.kind == stream && t.stop();
    });
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
      displayName: string;
      roomName: string;
      videoEnabled: boolean;
      audioEnabled: boolean;
      recording?: boolean;
      meta?: any;
    }
  ) {
    this.config = config;
    socket = socketIOClient(config.url, {
      query: `accessToken=${token}&meta=` + JSON.stringify(config.meta || ''),
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
      clearInterval(handle);
    });

    socket.on('message', (parsedMessage: any) => {
      if (parsedMessage.id != 'stats') console.log(parsedMessage, 'message');
      switch (parsedMessage.id) {
        case 'existingParticipants':
          console.log(parsedMessage.id, '*****', parsedMessage);
          this.onExistingParticipants(parsedMessage);
          break;

        case 'newParticipantArrived':
          this.onNewParticipant(parsedMessage);
          break;

        case 'newScreenShared':
          // console.log(parsedMessage.id, '@@@@', parsedMessage);
          // this.onNewScreenShared(parsedMessage);
          break;
        case 'screenShared':
          console.log(parsedMessage.id, '@@@@', parsedMessage);
          // this.onScreenShared(parsedMessage);
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
          clearInterval(handle);

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
          // {
          //   const participant = this.room.participants.get(parsedMessage.name);
          //   if (participant) {
          //     participant.setAudio(parsedMessage.value);
          //   }
          // }
          break;
        case 'setVideo':
          {
            // const participant = this.room.participants.get(parsedMessage.name);
            // if (participant) {
            //   console.log('hello here', parsedMessage.value);
            //   // participant.setVideo(parsedMessage.value);
            //   participant.setVideo(parsedMessage.value);
            //   if (parsedMessage.value) {
            //     this.startStream(participant);
            //     // navigator.mediaDevices['getTracks']({
            //     //   video: true,
            //     //   audio: true,
            //     // });
            //   } else {
            //     this.stopStream(participant);
            //   }
            // } else {
            //   // this.setMedia(participant, 'video', parsedMessage.value);
            // }
          }
          break;

        case 'receiveVideo':
          {
            const participant: any = this.room.participants.get(
              parsedMessage.name
            );
            if (participant) {
              var video = participant.getVideoElement();

              var options = {
                remoteVideo: video,
                onicecandidate: this.onIceCandidate.bind(
                  participant,
                  participant,
                  this.currentParticipantName
                ),
              };
              participant.rtcPeer.dispose();
              //@ts-ignore
              participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(
                options,
                error => {
                  if (error) {
                    return console.error(error);
                  }
                  participant.rtcPeer.generateOffer(
                    this.offerToReceiveVideo.bind(
                      participant,
                      participant,
                      this.currentParticipantName
                    )
                  );
                }
              );
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
        case 'stats':
          this.saveStats(parsedMessage);
          break;
      }
    });

    return new Promise((resolve, reject) => {
      socket.on('connect', () => {
        var message = {
          id: 'joinRoom',
          name: config.name,
          displayName: config.displayName,
          roomName: config.roomName,
          videoEnabled: config.videoEnabled,
          audioEnabled: true,
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

  offerToReceiveVideo(
    participant: any,
    currentUser: any,
    error: any,
    offerSdp: any,
    wp: any
  ) {
    if (error) return console.error('sdp offer error');

    console.log(currentUser, 'participant here');

    var msg = {
      id: 'receiveVideoFrom',
      user: currentUser,
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

  onIceCandidate = (
    participant: any,
    currentUser: any,
    candidate: any,
    wp: any
  ) => {
    console.log('hello here on new sceen 2222');
    var message = {
      id: 'onIceCandidate',
      user: currentUser,
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

  // onNewScreenShared(request: any) {
  //   var participant = new Participant('Screen-' + request.name, this.room);

  //   if (this.room) {
  //     var video = participant.getVideoElement();
  //     var options = {
  //       remoteVideo: video,
  //       onicecandidate: this.onIceCandidate.bind(participant, participant),
  //     };

  //     console.log('hello here on new sceen');
  //     //@ts-ignore
  //     participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(
  //       options,
  //       error => {
  //         if (error) {
  //           return console.error(error);
  //         }
  //         participant.rtcPeer.generateOffer(
  //           this.offerToReceiveVideo.bind(
  //             participant,
  //             participant,
  //             this.currentParticipantName
  //           )
  //         );
  //         this.room.connectParticipant(participant);
  //       }
  //     );
  //   }
  // }

  onNewParticipant(request: any) {
    console.log('request name new', request.name);
    console.log('request displayName new', request.displayName);
    this.receiveVideo(request.name, request.displayName);
  }

  addListenerForScreen(participant: any) {
    if (participant && this.isScreen(participant.name)) {
      const screenTrack = participant.track.srcObject.getTracks();
      if (this.currentParticipantName) {
        var message = {
          id: 'stopScreenSharing',
          name: this.currentParticipantName,
          roomName: this.room.name,
        };
        screenTrack[0].onended = () => {
          this.sendMessage(message);
        };
      }
    }
  }

  isScreen(participantName: any) {
    if (participantName.startsWith('Screen-')) {
      return true;
    }
    return false;
  }

  onExistingParticipants(request: any) {
    console.log('request name', request.name);
    console.log('request displayName', request.displayName);
    var constraints: any = {
      audio: true,
      video: this.config.videoEnabled ? DEFAULT_VIDEO_CONSTRAINT : false,
    };
    let name = request.name;
    let displayName = request.displayName;
    if (this.room) {
      console.log('request onExistingParticipants', name, displayName);

      var participant = new Participant(name, displayName, this.room);
      var video = participant.getVideoElement();

      // var videoScreen = participant.getScreenElement();
      let video_el = this.screenShare; //
      // docume/nt.getElementById('share-_video');

      let isScreen = false;
      if (participant.name.startsWith('Screen-')) {
        isScreen = true;
        constraints = {
          audio: true,
          video: this.config.videoEnabled ? DEFAULT_SCREEN_CONSTRAINT : false,
        };
      }

      var video = participant.getVideoElement();
      video.srcObject = video_el.srcObject;
      var options = {
        localVideo: video,
        videoStream: video_el.srcObject,
        mediaConstraints: constraints,
        onicecandidate: this.onIceCandidate.bind(
          participant,
          participant,
          participant.name
        ),
        // sendSource: 'desktop',
      };

      console.log('asbhasoptions', options);
      //@ts-ignore
      participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(
        options,
        error => {
          if (error) {
            return console.error(error);
          }

          participant.rtcPeer.generateOffer(
            this.offerToReceiveVideo.bind(
              participant,
              participant,
              participant.name
            )
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
          this.activateStatsTimeout(participant);
          this.addListenerForScreen(participant);
        }
      );
      request.data.forEach((element: any) => {
        this.receiveVideo(element.name, element.displayName);
      });
    }

    // }
  }

  activateStatsTimeout = (participant: any) => {
    let $this = this;
    handle = setInterval(function() {
      $this.printStats(participant);
    }, 2000);
  };

  printStats = (participant: any) => {
    let $this = this;
    this.getBrowserOutgoingVideoStats(participant.rtcPeer, function(
      // this.getBrowserOutgoingVideoStats(this.currentUser.rtcPeer, function(
      error: any,
      stats: any
    ) {
      if (error) {
        console.log('getBrowserOutgoingVideoStats error', error);
        return;
      }
      const message = {
        id: 'getBrowserOutgoingVideoStats',
        name: participant.name,
        roomName: $this.room.name,
        stats: stats,
      };
      $this.sendMessage(message);
    });
    this.getBrowserIncomingVideoStats(participant.rtcPeer, function(
      // this.getBrowserIncomingVideoStats(this.currentUser.rtcPeer, function(
      error: any,
      stats: any
    ) {
      if (error) {
        console.log('getBrowserIncomingVideoStats error', error);
        return;
      }
      const message = {
        id: 'getBrowserIncomingVideoStats',
        name: participant.name,
        roomName: $this.room.name,
        stats: stats,
      };
      $this.sendMessage(message);
    });
  };

  setAudio = (value: boolean) => {
    if (this.currentUser) {
      const participant = this.currentUser;
      if (participant) {
        participant.setAudio(value);
        this.config.audioEnabled = value;

        // if (value) {
        //   this.startStream(participant, 'audio');
        // } else {
        //   this.stopStream(participant, 'audio');
        // }

        var msg = {
          id: 'setAudio',
          sender: participant.name,
          value: value,
          roomName: this.room.name,
        };
        socket.emit('message', msg);
      }
    }
  };
  setVideo(value: boolean) {
    if (this.currentUser) {
      const participant = this.currentUser;
      if (participant) {
        participant.setVideo(value);
        this.config.videoEnabled = value;

        if (value) {
          this.startStream(participant);
        } else {
          this.stopStream(participant, 'video');
        }

        var msg = {
          id: 'setVideo',
          sender: participant.name,
          value: value,
          roomName: this.room.name,
        };
        socket.emit('message', msg);
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

  getBrowserOutgoingVideoStats = (webRtcPeer: any, callback: any) => {
    if (!webRtcPeer) return callback('Cannot get stats from null webRtcPeer');
    let peerConnection = webRtcPeer.peerConnection;
    if (!peerConnection)
      return callback('Cannot get stats from null peerConnection');
    let localVideoStream = peerConnection.getLocalStreams()[0];
    if (!localVideoStream)
      return callback('Non existent local stream: cannot read stats');
    let localVideoTrack = localVideoStream.getVideoTracks()[0];
    if (!localVideoTrack)
      return callback('Non existent local video track: cannot read stats');

    peerConnection
      .getStats(localVideoTrack)
      .then(function(stats: any) {
        let retVal = { isRemote: false };

        // "stats" is of type RTCStatsReport
        // https://www.w3.org/TR/webrtc/#rtcstatsreport-object
        // https://developer.mozilla.org/en-US/docs/Web/API/RTCStatsReport
        // which behaves like a Map
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
        const statsArr = Array.from(stats.values());

        // "report.type" is of type RTCStatsType
        // https://developer.mozilla.org/en-US/docs/Web/API/RTCStatsType
        const reportsRtp = statsArr.filter((report: any) => {
          return report.type === 'outbound-rtp';
        });
        const reportsCandidatePair = statsArr.filter((report: any) => {
          return report.type === 'candidate-pair';
        });
        const reportsCodec = statsArr.filter((report: any) => {
          return report.type === 'codec';
        });

        // Get the first RTP report to import its stats
        if (reportsRtp.length < 1) {
          console.warn('No RTP reports found in RTCStats');
          return;
        }
        const reportRtp: any = reportsRtp[0];

        // RTCStats
        // https://w3c.github.io/webrtc-stats/#dom-rtcstats
        retVal['timestamp'] = reportRtp.timestamp;

        // RTCRtpStreamStats
        // https://w3c.github.io/webrtc-stats/#dom-rtcrtpstreamstats
        retVal['ssrc'] = reportRtp.ssrc;

        // RTCSentRtpStreamStats
        // https://w3c.github.io/webrtc-stats/#dom-rtcsentrtpstreamstats
        retVal['packetsSent'] = reportRtp.packetsSent;
        retVal['bytesSent'] = reportRtp.bytesSent;

        // RTCOutboundRtpStreamStats
        // https://w3c.github.io/webrtc-stats/#dom-rtcoutboundrtpstreamstats
        retVal['nackCount'] = reportRtp.nackCount;
        retVal['firCount'] = 'firCount' in reportRtp ? reportRtp.firCount : 0;
        retVal['pliCount'] = 'pliCount' in reportRtp ? reportRtp.pliCount : 0;
        retVal['sliCount'] = 'sliCount' in reportRtp ? reportRtp.sliCount : 0;

        //  RTCIceCandidatePairStats
        // https://w3c.github.io/webrtc-stats/#dom-rtcicecandidatepairstats
        const matchCandidatePairs: any = reportsCandidatePair.filter(
          (pair: any) => {
            return pair.transportId === reportRtp.transportId;
          }
        );
        if (matchCandidatePairs.length > 0) {
          retVal['iceRoundTripTime'] =
            matchCandidatePairs[0].currentRoundTripTime;
          retVal['availableBitrate'] =
            matchCandidatePairs[0].availableOutgoingBitrate;
        }

        return callback(null, retVal);
      })
      .catch(function(err: any) {
        return callback(err, null);
      });
  };

  getBrowserIncomingVideoStats = (webRtcPeer: any, callback: any) => {
    if (!webRtcPeer) return callback('Cannot get stats from null webRtcPeer');
    var peerConnection = webRtcPeer.peerConnection;
    if (!peerConnection)
      return callback('Cannot get stats from null peerConnection');
    var remoteVideoStream = peerConnection.getRemoteStreams()[0];
    if (!remoteVideoStream)
      return callback('Non existent remote stream: cannot read stats');
    var remoteVideoTrack = remoteVideoStream.getVideoTracks()[0];
    if (!remoteVideoTrack)
      return callback('Non existent remote video track: cannot read stats');

    peerConnection
      .getStats(remoteVideoTrack)
      .then(function(stats: any) {
        let retVal = { isRemote: true };

        // "stats" is of type RTCStatsReport
        // https://www.w3.org/TR/webrtc/#rtcstatsreport-object
        // https://developer.mozilla.org/en-US/docs/Web/API/RTCStatsReport
        // which behaves like a Map
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
        const statsArr = Array.from(stats.values());

        // "report.type" is of type RTCStatsType
        // https://developer.mozilla.org/en-US/docs/Web/API/RTCStatsType
        const reportsRtp = statsArr.filter((report: any) => {
          return report.type === 'inbound-rtp';
        });
        const reportsCandidatePair = statsArr.filter((report: any) => {
          return report.type === 'candidate-pair';
        });
        const reportsCodec = statsArr.filter((report: any) => {
          return report.type === 'codec';
        });

        // Get the first RTP report to import its stats
        if (reportsRtp.length < 1) {
          console.warn('No RTP reports found in RTCStats');
          return;
        }
        const reportRtp: any = reportsRtp[0];

        // RTCStats
        // https://w3c.github.io/webrtc-stats/#dom-rtcstats
        retVal['timestamp'] = reportRtp.timestamp;

        // RTCRtpStreamStats
        // https://w3c.github.io/webrtc-stats/#dom-rtcrtpstreamstats
        retVal['ssrc'] = reportRtp.ssrc;

        // RTCReceivedRtpStreamStats
        // https://w3c.github.io/webrtc-stats/#dom-rtcreceivedrtpstreamstats
        retVal['packetsReceived'] = reportRtp.packetsReceived;
        retVal['packetsLost'] = reportRtp.packetsLost;
        retVal['jitter'] = reportRtp.jitter;

        // RTCInboundRtpStreamStats
        // https://w3c.github.io/webrtc-stats/#dom-rtcinboundrtpstreamstats
        retVal['bytesReceived'] = reportRtp.bytesReceived;
        retVal['nackCount'] = reportRtp.nackCount;
        retVal['firCount'] = 'firCount' in reportRtp ? reportRtp.firCount : 0;
        retVal['pliCount'] = 'pliCount' in reportRtp ? reportRtp.pliCount : 0;
        retVal['sliCount'] = 'sliCount' in reportRtp ? reportRtp.sliCount : 0;

        //  RTCIceCandidatePairStats
        // https://w3c.github.io/webrtc-stats/#dom-rtcicecandidatepairstats
        const matchCandidatePairs: any = reportsCandidatePair.filter(
          (pair: any) => {
            return pair.transportId === reportRtp.transportId;
          }
        );
        if (matchCandidatePairs.length > 0) {
          retVal['iceRoundTripTime'] =
            matchCandidatePairs[0].currentRoundTripTime;
          retVal['availableBitrate'] =
            matchCandidatePairs[0].availableIncomingBitrate;
        }

        return callback(null, retVal);
      })
      .catch(function(err: any) {
        return callback(err, null);
      });
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
        if (stream.getVideoTracks()[0] && stream.getVideoTracks()[0].label) {
          if (stream.getVideoTracks()[0].label.startsWith('screen')) {
            console.log(
              'CORRECT Screen share',
              stream.getVideoTracks()[0].label
            );
          } else {
            console.log(
              'INCORRECT Screen share',
              stream.getVideoTracks()[0].label
            );
            stream.getVideoTracks()[0].stop();
            return;
          }
        }
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
          this.sendMessage(message);
        }
      })
      .catch((error: any) => {
        console.log(error);
      });
  }

  receiveVideo = (name: any, displayName: any) => {
    console.log('request receiveVideo', name, displayName);
    var participant = new Participant(name, displayName, this.room);

    console.log('receive video', name, this.currentParticipantName);
    if (this.room) {
      var video = participant.getVideoElement();

      var options = {
        remoteVideo: video,
        onicecandidate: this.onIceCandidate.bind(
          participant,
          participant,
          this.currentParticipantName
        ),
      };
      //@ts-ignore
      participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(
        options,
        error => {
          if (error) {
            return console.error(error);
          }
          participant.rtcPeer.generateOffer(
            this.offerToReceiveVideo.bind(
              participant,
              participant,
              this.currentParticipantName
            )
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

  // setMedia(participant: any, k: any, value: boolean) {
  //   // if (!value) {

  //   console.log(participant.track.srcObject.getTracks(), 'tracks here');

  //   // participant.track.srcObject.getTracks().map((t: any) => {
  //   //   return t.kind == k && t.stop();
  //   // });
  //   // } else {
  //   // if (this.currentUser === participant) {
  //   participant = participant
  //     ? participant
  //     : new Participant(this.currentParticipantName, this.room);

  //   var constraints: any = {
  //     audio: true,
  //     video: {
  //       mandatory: {
  //         maxWidth: 1280,
  //         maxHeight: 720,
  //         maxFrameRate: 30,
  //         minFrameRate: 15,
  //       },
  //     },
  //   };
  //   if (this.room) {
  //     var video = participant.getVideoElement();
  //     let video_el = this.screenShare; //

  //     video.srcObject = video_el.srcObject;
  //     var options = {
  //       localVideo: video,
  //       // videoStream: video_el.srcObject,
  //       mediaConstraints: constraints,
  //       onicecandidate: this.onIceCandidate.bind(participant, participant),
  //       // sendSource: 'desktop',
  //     };

  //     //@ts-ignore
  //     participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(
  //       options,
  //       error => {
  //         if (error) {
  //           return console.error(error);
  //         }
  //         participant.rtcPeer.generateOffer(
  //           this.offerToReceiveVideo.bind(participant, participant)
  //         );

  //         participant.rtcPeer.videoEnabled = true;
  //         participant.rtcPeer.audioEnabled = true;
  //         if (!this.config.videoEnabled) {
  //           participant.rtcPeer.videoEnabled = false;
  //         }
  //         if (!this.config.audioEnabled) {
  //           participant.rtcPeer.audioEnabled = false;
  //         }
  //         // this.room.connectParticipant(participant);
  //       }
  //     );
  //     // }
  //     // }
  //   }
  // }

  saveStats(request: any) {
    if (this.currentUser && request.stats) {
      let stats = {};
      if (request.stats.type == 'browserOutgoingVideoStats') {
        stats = {
          browserOutgoingSsrc: request.stats.ssrc,
          browserPacketsSent: request.stats.packetsSent,
          browserBytesSent: request.stats.bytesSent,
          browserNackReceived: request.stats.nackCount,
          browserFirReceived: request.stats.firCount,
          browserPliReceived: request.stats.pliCount,
          browserOutgoingIceRtt: request.stats.iceRoundTripTime,
          browserOutgoingAvailableBitrate: request.stats.availableBitrate,
        };
      } else if (request.stats.type == 'browserIncomingVideoStats') {
        stats = {
          browserIncomingSsrc: request.stats.ssrc,
          browserPacketsReceived: request.stats.packetsReceived,
          browserBytesReceived: request.stats.bytesReceived,
          browserIncomingPacketsLost: request.stats.packetsLost,
          browserIncomingJitter: request.stats.jitter,
          browserNackSent: request.stats.nackCount,
          browserFirSent: request.stats.firCount,
          browserPliSent: request.stats.pliCount,
          browserIncomingIceRtt: request.stats.iceRoundTripTime,
          browserIncomingAvailableBitrate: request.stats.availableBitrate,
        };
      } else if (request.stats.type == 'inboundrtp') {
        stats = {
          kmsIncomingSsrc: request.stats.ssrc,
          kmsBytesReceived: request.stats.bytesReceived,
          kmsPacketsReceived: request.stats.packetsReceived,
          kmsPliSent: request.stats.pliCount,
          kmsFirSent: request.stats.firCount,
          kmsNackSent: request.stats.nackCount,
          kmsJitter: request.stats.jitter,
          kmsPacketsLost: request.stats.packetsLost,
          kmsFractionLost: request.stats.fractionLost,
          kmsRembSend: request.stats.remb,
        };
      } else if (request.stats.type == 'outboundrtp') {
        stats = {
          kmsOutogingSsrc: request.stats.ssrc,
          kmsBytesSent: request.stats.bytesSent,
          kmsPacketsSent: request.stats.packetsSent,
          kmsPliReceived: request.stats.pliCount,
          kmsFirReceived: request.stats.firCount,
          kmsNackReceived: request.stats.nackCount,
          kmsRtt: request.stats.roundTripTime,
          kmsRembReceived: request.stats.remb,
        };
      } else if (request.stats.type == 'endpoint') {
        stats = {
          e2eLatency: request.stats.videoE2ELatency,
        };
      }
      console.log('request.name', request.name);
      this.emit('stats', {
        stats: stats,
        type: request.stats.type,
        isScreen: request.name.startsWith('Screen-'),
      });
    }
  }
}

export default Video;
