import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { data, Video } from '../src';
import { forEach, result } from 'lodash';
import kurentoUtils from 'kurento-utils';

import { TRIANGULATION } from './triangulation';
// const App = () => {
//   return <div>{data}</div>;
// };

require('./index.css');

const facemesh = require('@tensorflow-models/facemesh');
require('@tensorflow/tfjs-backend-webgl');
const roomName = `room-${Math.ceil(Math.random() * 5)}`;

const VideoSDK = new Video();
window['video'] = VideoSDK;
class App extends React.Component<any, any> {
  model: any;
  synth: any;
  videoWidth: string;
  videoHeight: string;
  ctx: any;
  canvas: any;
  recognition: any;

  constructor(props: any) {
    super(props);

    this.state = {
      caption: '',
      devicesConnected: false,
    };
    // this.recognition = new webkitSpeechRecognition();

    // this.recognition.continuous = true;
    // this.recognition.interimResults = true;

    // this.recognition.onresult = event => {
    //   if (event.results.length > 0) {
    //     console.log(event.results, 'speech ::: result here');
    //     let subtitle = '';
    //     const value = event.results[event.results.length - 1];
    //     subtitle += ' ' + value[0].transcript;

    //     if (value.isFinal) {
    //       // console.log(value, 'speech ::: caption here');
    //       VideoSDK.sendMessage({
    //         query: subtitle,
    //         id: 'query',
    //       });
    //     }

    //     this.setState({
    //       caption: subtitle,
    //     });
    //   }
    // };
    // // this.recognition.onresult = function(event) {
    // //   console.log(event.results, 'result here');
    // // };
    // this.recognition.onerror = function(event) {
    //   console.log(event, 'speech ::: onerror here');
    // };
    // this.recognition.onend = function() {
    //   this.recognition.start();
    //   console.log('speech ::: end here');
    // };

    //

    //
    //
    ///

    this.synth = speechSynthesis;

    // Element initialization section

    const voice_select = document.getElementById('voice-select');

    // Retrieving the different voices and putting them as
    // options in our speech selection section
    let voices = [];
    // const getVoice = () => {
    //   // This method retrieves voices and is asynchronously loaded
    //   voices = synth.getVoices();
    //   var option_string = '';
    //   voices.forEach(value => {
    //     var option = value.name + ' (' + value.lang + ') ';
    //     var newOption =
    //       "<option data-name='" +
    //       value.name +
    //       "' data-lang='" +
    //       value.lang +
    //       "'>" +
    //       option +
    //       '</option>\n';
    //     option_string += newOption;
    //   });

    //   voice_select.innerHTML = option_string;
    // };

    // Since synth.getVoices() is loaded asynchronously, this
    // event gets fired when the return object of that
    // function has changed

    console.log(this.synth, 'hello 123123');
    this.synth.onvoiceschanged = function() {
      // getVoice();
    };
  }

  record = () => {
    VideoSDK.record();
  };
  speak = (text?: string) => {
    //

    // const form = document.querySelector('form');
    const textarea = document.getElementById('maintext');
    // const rate = document.getElementById('rate');
    // const pitch = document.getElementById('pitch');
    // const rateval = document.getElementById('rate-value');
    // const pitchval = document.getElementById('pitch-value');

    // console.log(textarea, textarea.innerHTML, 'helllo here');
    if (!textarea) {
      return;
    }

    const text = text ? text : textarea.value;

    console.log(textarea.innerHTML);
    // If the speech mode is on we dont want to load
    // another speech
    if (this.synth.speaking) {
      alert('Already speaking....');
      return;
    }

    // If the text area is not empty that is if the input
    // is not empty
    if (text !== '') {
      // Creating an object of SpeechSynthesisUtterance with
      // the input value that represents a speech request
      const speakText = new SpeechSynthesisUtterance(text);

      // When the speaking is ended this method is fired
      speakText.onend = e => {
        console.log('Speaking is done!');
      };

      // When any error occurs this method is fired
      speakText.error = e => {
        console.error('Error occured...');
      };

      // Selecting the voice for the speech from the selection DOM
      // const id = voice_select.selectedIndex;
      // const selectedVoice = voice_select.selectedOptions[0].getAttribute(
      //   'data-name'
      // );

      // // Checking which voices has been chosen from the selection
      // // and setting the voice to the chosen voice
      // voices.forEach(voice => {
      //   if (voice.name === selectedVoice) {
      //     speakText.voice = voice;
      //   }
      // });

      // Setting the rate and pitch of the voice
      // speakText.rate = 0.5;
      // speakText.pitch = 0.5;

      // Finally calling the speech function that enables speech
      this.synth.speak(speakText);
    }
  };

  drawPath(ctx, points, closePath) {
    const region = new Path2D();
    region.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      region.lineTo(point[0], point[1]);
    }

    if (closePath) {
      region.closePath();
    }
    ctx.stroke(region);
  }

  renderPrediction = async (
    canvas: any,
    ctx: any,
    participant: any,
    model: any
  ) => {
    let video = document.getElementById(`video-${participant.name}`);

    const predictions = await model.estimateFaces(video);
    ctx.drawImage(video, 0, 0, 320, 240);

    if (predictions.length > 0) {
      // this.ctx.clearRect(0, 0, canvas.width, canvas.height);

      predictions.forEach(prediction => {
        const keypoints = prediction.scaledMesh;

        console.log(keypoints, 'key points here');
        if (true) {
          for (let i = 0; i < TRIANGULATION.length / 3; i++) {
            const points = [
              TRIANGULATION[i * 3],
              TRIANGULATION[i * 3 + 1],
              TRIANGULATION[i * 3 + 2],
            ].map(index => keypoints[index]);
            this.drawPath(ctx, points, true);
          }
        } else {
          for (let i = 0; i < keypoints.length; i++) {
            const x = keypoints[i][0];
            const y = keypoints[i][1];
            ctx.beginPath();
            ctx.arc(x, y, 1 /* radius */, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      });
    }

    requestAnimationFrame(
      this.renderPrediction.bind(this, canvas, ctx, participant, model)
    );
  };

  stop = k => {
    const video = VideoSDK.currentUser?.track;
    video.srcObject.getTracks().map(t => {
      console.log(t, 't here ');
      return t.kind == k && t.stop();
    });
  };
  start = k => {
    // video.srcObject.getTracks().map(t => t.kind == k && t.stop(false));

    // docume/nt.getElementById('share-screen-video');

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

    const participant = VideoSDK.currentUser;

    if (!participant) {
      return;
    }
    var video = VideoSDK.currentUser?.track;
    var options = {
      localVideo: video,
      mediaConstraints: constraints,
      onicecandidate: VideoSDK.onIceCandidate.bind(participant, participant),
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
          VideoSDK.offerToReceiveVideo.bind(participant, participant)
        );

        // participant.rtcPeer.videoEnabled = true;
        // participant.rtcPeer.audioEnabled = true;
        // if (!this.config.videoEnabled) {
        //   participant.rtcPeer.videoEnabled = false;
        // }
        // if (!this.config.audioEnabled) {
        //   participant.rtcPeer.audioEnabled = false;
        // }
        // this.room.connectParticipant(participant);
      }
    );
  };

  parseStats = res => {
    Object.keys(res.stats).forEach(key => {
      document.getElementById((res.isScreen ? 'screen-' : '') + key).innerHTML =
        res.stats[key];
    });
  };

  componentDidMount() {
    VideoSDK.on('devicesConnected', () => {
      this.setState({
        devicesConnected: true,
      });
      console.log(VideoSDK.getAudioOutputDevices(), 'audio output devices @@@');
      console.log(VideoSDK.getAudioInputDevices(), 'audio output devices @@@');
      console.log(VideoSDK.getVideoInputDevices(), 'audio output devices @@@');
    });

    VideoSDK.on('stats', res => {
      this.parseStats(res);
    });

    // document.getElementById('sample-video').play();

    let randomNo = Math.ceil(Math.random() * 5);
    VideoSDK.connect(`ttg-socket-server-token`, {
      // url: 'https://176.9.72.40:3000/',
      url: 'https://localhost/',
      name: `Suraj` + randomNo,
      displayName: `Suraj Ahmed ` + randomNo,
      // name: `Suraj`,
      roomName: roomName,
      videoEnabled: true,
      audioEnabled: false,
      recording: true,
      meta: {
        type: 'opening_interview',
      },
    })
      .then(async (room: any) => {
        forEach(room.participants, participant => {
          console.log(participant, 'data here');
        });

        room.on('participantConnected', async participantConnected => {
          let name = participantConnected.name;
          let displayName = participantConnected.displayName;

          var container = document.createElement('div');

          container.className = 'canvas-wrapper';
          container.style.display = 'flex';
          container.id = 'video-' + name;

          var span = document.createElement('span');

          span.appendChild(
            document.createTextNode(name + `(${displayName || name})`)
          );
          container.appendChild(span);

          //@ts-ignore
          var video = participantConnected.getVideoElement();

          video.style.width = '600px';
          video.style.transform =
            participantConnected === VideoSDK.currentUser
              ? `rotateY(180deg)`
              : undefined;

          var canvas: any = document.createElement('canvas');
          canvas.id = 'output-' + participantConnected.name;

          container.appendChild(video);
          container.appendChild(canvas);

          //@ts-ignore
          document.getElementById('participants').appendChild(container);

          participantConnected.on('startScreenSharing', () => {
            console.log('screen shared started');
          });

          participantConnected.on('stopScreenSharing', () => {
            console.log('screen shared stopped');
          });
          // setTimeout(async () => {
          //   this.videoWidth = '320'; //video.getBoundingClientRect().width;
          //   this.videoHeight = '240'; //video.getBoundingClientRect().height;

          //   canvas.width = this.videoWidth;
          //   canvas.height = this.videoHeight;

          //   const canvasContainer: any = document.querySelector(
          //     '.canvas-wrapper'
          //   );

          //   canvasContainer.style.width = this.videoWidth + 'px';
          //   canvasContainer.style.height = this.videoHeight + 'px';
          //   const ctx = canvas.getContext('2d');

          //   // this.ctx.translate(canvas.width, 0);
          //   // this.ctx.scale(-1, 1);

          //   if (!ctx) {
          //     return;
          //   }
          //   ctx.fillStyle = '#32EEDB';
          //   ctx.strokeStyle = '#32EEDB';
          //   ctx.lineWidth = 0.5;
          //   const model = await facemesh.load({ maxFaces: 1 });
          // }, 1000);
        });

        room.on('participantDisconnected', participant => {
          console.log('participant disconnected');
          var element = document.getElementById('video-' + participant.name);
          if (element) {
            element.parentNode.removeChild(element);
          }
          //
        });

        room.on('receiveText', participant => {
          let name = participant.sender;
          let displayName = participant.senderDisplayName;
          console.log(
            'receiveText 1',
            participant,
            VideoSDK.currentParticipantName
          );

          var div1 = document.createElement('div');
          div1.className = 'div-wrapper';

          div1.appendChild(
            document.createTextNode(
              VideoSDK.currentParticipantName == name ? 'You' : displayName
            )
          );
          var div2 = document.createElement('div');
          div2.appendChild(document.createTextNode(participant.text));
          div1.appendChild(div2);
          document.getElementById('messages').appendChild(div1);
        });

        room.on('disconnected', error => {
          room.participants.forEach(participant => {
            //
          });
        });

        room.on('speak', data => {
          console.log('room disconnected', data);
          this.speak(data.msg);

          // room.participants.forEach(participant => {
          //   //
          // });
        });
      })
      .catch(Error => {
        console.log(Error, 'error here');
        console.log(Error);
      });
  }

  changeAudioDestination = (deviceId: string) => {
    // const deviceId = event.target.value;
    // const outputSelector = event.target;
    // // FIXME: Make the media element lookup dynamic.
    // const element = event.path[2].childNodes[1];
    // // attachSinkId(element, deviceId, outputSelector);

    console.log(deviceId, 'input/output');

    const element = document.getElementById('sample-video');

    if (element) {
      //@ts-ignore
      element.setSinkId(deviceId).then(function() {
        console.log('hello here');
      });
    }
  };

  render() {
    return (
      <>
        <title>{roomName}</title>
        <div style={{ display: 'flex' }}>
          <div style={{ width: '70%' }}>
            <button
              onClick={() => {
                console.log(VideoSDK, 'participants here');
                VideoSDK.leaveRoom();
              }}
            >
              Leave room
            </button>

            <button
              onClick={() => {
                console.log(VideoSDK, 'participants here');
                VideoSDK.shareScreen();
              }}
            >
              Share Screen
            </button>

            <button
              onClick={() => {
                console.log(VideoSDK, 'participants here');
                VideoSDK.stopScreenSharing();
              }}
            >
              stop sharing Screen
            </button>

            {/* <button
          onClick={() => {
            // this.recognition.start();
            this.speak('hello there!');
          }}
        >
          speak
        </button>
        <button
          onClick={() => {
            // this.recognition.start();
            this.record();
          }}
        >
          record
        </button> */}
            <button
              onClick={() => {
                // this.recognition.start();
                // this.start('video');
                VideoSDK.setVideo(true);
              }}
            >
              start video
            </button>
            <button
              onClick={() => {
                VideoSDK.setVideo(false);
              }}
            >
              stop video
            </button>

            <button
              onClick={() => {
                // this.recognition.start();
                // this.start('video');
                VideoSDK.setAudio(true);
              }}
            >
              start audio
            </button>
            <button
              onClick={() => {
                VideoSDK.setAudio(false);
              }}
            >
              stop audio
            </button>

            <button
              onClick={() => {
                console.log('speech ::: start here', 'participants here');

                // final_transcript = '';
                // this.recognition.lang = select_dialect.value;
                // recognition.start();

                this.recognition.start();
              }}
            >
              start
            </button>

            {/* <Grid templateColumns="repeat(3, 1fr)" mt="5" gap={6}>
          <Box>
            <Text fontSize="xs" mb="1">
              Microphone
            </Text>
            <Select
              size="sm"
              id="audioSource"
              value={microphone}
              onChange={e => {
                setMicrophone(e.target.value);
              }}
              isDisabled={!audioEnabled}
            />
          </Box>
          <Box>
            <Text fontSize="xs" mb="1">
              Speaker
            </Text>
            <Select
              size="sm"
              id="audioOutput"
              value={speaker}
              onChange={e => {
                setSpeaker(e.target.value);
              }}
            />
          </Box>
          <Box>
            <Text fontSize="xs" mb="1">
              Camera
            </Text>
            <Select
              size="sm"
              id="videoSource"
              value={camera}
              onChange={e => {
                setCamera(e.target.value);
              }}
            />
          </Box>
        </Grid> */}

            {/* <button
          onClick={() => {
            console.log('speech ::: start here', 'participants here');
          }}
        >
          quickstart
        </button> */}

            <div id="participants" />
            <div className="canvas-wrapper">
              <video
                id="screen-video"
                style={{
                  display: 'none',
                }}
                autoplay="autoplay"
                width="400"
              ></video>
            </div>
            <div id="scatter-gl-container"></div>

            <div id="subtitle">{this.state.caption}</div>
            {/* <textarea id="maintext" rows={5} cols={50} /> */}

            {/* <video
          id="sample-video"
          // autoplay="autoplay"
          width="400"
          controls
          src="https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4"
        ></video> */}

            <button
              onClick={() => {
                // this.recognition.start();
                VideoSDK.startPlaying();
              }}
            >
              play remote video
            </button>
            {/* <button
          onClick={() => {
            // this.recognition.start();
            // this.changeAudioDestination('default');
            VideoSDK.selectAudioOutputDevice('default');
          }}
        >
          change default
        </button> */}

            {VideoSDK.getAudioOutputDevices().map(element => {
              return (
                <button
                  style={{ margin: 5 }}
                  onClick={() => {
                    VideoSDK.selectAudioOutputDevice(element);
                  }}
                >
                  change audio des - {element.label}
                </button>
              );
            })}

            {VideoSDK.getAudioInputDevices().map(element => {
              return (
                <button
                  style={{ margin: 5 }}
                  onClick={() => {
                    VideoSDK.selectAudioInputDevice(element);
                  }}
                >
                  change audio input - {element.label} - {element.deviceId}
                </button>
              );
            })}

            {/* <button
          onClick={() => {
            // this.recognition.start();
            VideoSDK.selectAudioOutputDevice(
              'bd0cd91e87ed9656c6365394db3060aa56cbf77f5fe142d3385c6729c661c807'
            );
            // this.changeAudioDestination(
            //   'bd0cd91e87ed9656c6365394db3060aa56cbf77f5fe142d3385c6729c661c807'
            // );
          }}
        >
          change audio des
          bd0cd91e87ed9656c6365394db3060aa56cbf77f5fe142d3385c6729c661c807
          {VideoSDK.getAudioOutputDevices()[
            VideoSDK.getAudioOutputDevices().length - 1
          ]
            ? VideoSDK.getAudioOutputDevices()[
                VideoSDK.getAudioOutputDevices().length - 1
              ].deviceId
            : ''}
        </button> */}

            {/* <button
          onClick={() => {
            // this.recognition.start();
            VideoSDK.selectAudioInputDevice(
              '545b3941ae6c6cdc43abd45ad803cb8e324dcc4afc7cef157303ae4004ad7f0e'
            );

            // this.changeAudioDestination('default');
          }}
        >
          change audio input
          545b3941ae6c6cdc43abd45ad803cb8e324dcc4afc7cef157303ae4004ad7f0e
        </button> */}

            <div style={{ display: 'flex' }}>
              <div style={{ width: '50%' }}>
                <h3>Local Camera</h3>
                <table className="table table-condensed">
                  <tr>
                    <th>Stat</th>
                    <th>Browser (send)</th>
                    <th>KMS (recv)</th>
                  </tr>
                  <tr>
                    <td>SSRC</td>
                    <td id="browserOutgoingSsrc">--</td>
                    <td id="kmsIncomingSsrc">--</td>
                  </tr>
                  <tr>
                    <td>Packets</td>
                    <td id="browserPacketsSent">--</td>
                    <td id="kmsPacketsReceived">--</td>
                  </tr>
                  <tr>
                    <td>Bytes</td>
                    <td id="browserBytesSent">--</td>
                    <td id="kmsBytesReceived">--</td>
                  </tr>
                  <tr>
                    <td>Packets Lost</td>
                    <td>--</td>
                    <td id="kmsPacketsLost">--</td>
                  </tr>
                  <tr>
                    <td>Fraction Lost</td>
                    <td>--</td>
                    <td id="kmsFractionLost">--</td>
                  </tr>
                  <tr>
                    <td>Jitter</td>
                    <td>--</td>
                    <td id="kmsJitter">--</td>
                  </tr>
                  <tr>
                    <td>NACK</td>
                    <td id="browserNackReceived">--</td>
                    <td id="kmsNackSent">--</td>
                  </tr>
                  <tr>
                    <td>FIR</td>
                    <td id="browserFirReceived">--</td>
                    <td id="kmsFirSent">--</td>
                  </tr>
                  <tr>
                    <td>PLI</td>
                    <td id="browserPliReceived">--</td>
                    <td id="kmsPliSent">--</td>
                  </tr>
                  <tr>
                    <td>ICE RTT</td>
                    <td id="browserOutgoingIceRtt">--</td>
                    <td id="kmsRtt">--</td>
                  </tr>
                  <tr>
                    <td>REMB</td>
                    <td id="browserOutgoingAvailableBitrate">--</td>
                    <td id="kmsRembSend">--</td>
                  </tr>
                </table>
                <p>
                  KMS end-to-end latency:
                  <span id="e2eLatency">--</span>
                </p>
              </div>

              <div style={{ width: '50%' }}>
                <h3>Remote Camera</h3>
                <table className="table table-condensed">
                  <tr>
                    <th>Stat</th>
                    <th>KMS (send)</th>
                    <th>Browser (recv)</th>
                  </tr>
                  <tr>
                    <td>SSRC</td>
                    <td id="kmsOutogingSsrc">--</td>
                    <td id="browserIncomingSsrc">--</td>
                  </tr>
                  <tr>
                    <td>Packets</td>
                    <td id="kmsPacketsSent">--</td>
                    <td id="browserPacketsReceived">--</td>
                  </tr>
                  <tr>
                    <td>Bytes</td>
                    <td id="kmsBytesSent">--</td>
                    <td id="browserBytesReceived">--</td>
                  </tr>
                  <tr>
                    <td>Packets Lost</td>
                    <td>--</td>
                    <td id="browserIncomingPacketsLost">--</td>
                  </tr>
                  <tr>
                    <td>Fraction Lost</td>
                    <td id="kmsFractionLost">--</td>
                    <td>--</td>
                  </tr>
                  <tr>
                    <td>Jitter</td>
                    <td>--</td>
                    <td id="browserIncomingJitter">--</td>
                  </tr>
                  <tr>
                    <td>NACK</td>
                    <td id="kmsNackReceived">--</td>
                    <td id="browserNackSent">--</td>
                  </tr>
                  <tr>
                    <td>FIR</td>
                    <td id="kmsFirReceived">--</td>
                    <td id="browserFirSent">--</td>
                  </tr>
                  <tr>
                    <td>PLI</td>
                    <td id="kmsPliReceived">--</td>
                    <td id="browserPliSent">--</td>
                  </tr>
                  <tr>
                    <td>ICE RTT</td>
                    <td id="kmsRtt">--</td>
                    <td id="browserIncomingIceRtt">--</td>
                  </tr>
                  <tr>
                    <td>REMB</td>
                    <td id="kmsRembReceived">--</td>
                    <td id="browserIncomingAvailableBitrate">--</td>
                  </tr>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex' }}>
              <div style={{ width: '50%' }}>
                <h3>Local Screen</h3>
                <table className="table table-condensed">
                  <tr>
                    <th>Stat</th>
                    <th>Browser (send)</th>
                    <th>KMS (recv)</th>
                  </tr>
                  <tr>
                    <td>SSRC</td>
                    <td id="screen-browserOutgoingSsrc">--</td>
                    <td id="screen-kmsIncomingSsrc">--</td>
                  </tr>
                  <tr>
                    <td>Packets</td>
                    <td id="screen-browserPacketsSent">--</td>
                    <td id="screen-kmsPacketsReceived">--</td>
                  </tr>
                  <tr>
                    <td>Bytes</td>
                    <td id="screen-browserBytesSent">--</td>
                    <td id="screen-kmsBytesReceived">--</td>
                  </tr>
                  <tr>
                    <td>Packets Lost</td>
                    <td>--</td>
                    <td id="screen-kmsPacketsLost">--</td>
                  </tr>
                  <tr>
                    <td>Fraction Lost</td>
                    <td>--</td>
                    <td id="screen-kmsFractionLost">--</td>
                  </tr>
                  <tr>
                    <td>Jitter</td>
                    <td>--</td>
                    <td id="screen-kmsJitter">--</td>
                  </tr>
                  <tr>
                    <td>NACK</td>
                    <td id="screen-browserNackReceived">--</td>
                    <td id="screen-kmsNackSent">--</td>
                  </tr>
                  <tr>
                    <td>FIR</td>
                    <td id="screen-browserFirReceived">--</td>
                    <td id="screen-kmsFirSent">--</td>
                  </tr>
                  <tr>
                    <td>PLI</td>
                    <td id="screen-browserPliReceived">--</td>
                    <td id="screen-kmsPliSent">--</td>
                  </tr>
                  <tr>
                    <td>ICE RTT</td>
                    <td id="screen-browserOutgoingIceRtt">--</td>
                    <td id="screen-kmsRtt">--</td>
                  </tr>
                  <tr>
                    <td>REMB</td>
                    <td id="screen-browserOutgoingAvailableBitrate">--</td>
                    <td id="screen-kmsRembSend">--</td>
                  </tr>
                </table>
                <p>
                  KMS screen end-to-end latency:
                  <span id="screen-e2eLatency">--</span>
                </p>
              </div>

              <div style={{ width: '50%' }}>
                <h3>Remote Screen</h3>
                <table className="table table-condensed">
                  <tr>
                    <th>Stat</th>
                    <th>KMS (send)</th>
                    <th>Browser (recv)</th>
                  </tr>
                  <tr>
                    <td>SSRC</td>
                    <td id="screen-kmsOutogingSsrc">--</td>
                    <td id="screen-browserIncomingSsrc">--</td>
                  </tr>
                  <tr>
                    <td>Packets</td>
                    <td id="screen-kmsPacketsSent">--</td>
                    <td id="screen-browserPacketsReceived">--</td>
                  </tr>
                  <tr>
                    <td>Bytes</td>
                    <td id="screen-kmsBytesSent">--</td>
                    <td id="screen-browserBytesReceived">--</td>
                  </tr>
                  <tr>
                    <td>Packets Lost</td>
                    <td>--</td>
                    <td id="screen-browserIncomingPacketsLost">--</td>
                  </tr>
                  <tr>
                    <td>Fraction Lost</td>
                    <td id="screen-kmsFractionLost">--</td>
                    <td>--</td>
                  </tr>
                  <tr>
                    <td>Jitter</td>
                    <td>--</td>
                    <td id="screen-browserIncomingJitter">--</td>
                  </tr>
                  <tr>
                    <td>NACK</td>
                    <td id="screen-kmsNackReceived">--</td>
                    <td id="screen-browserNackSent">--</td>
                  </tr>
                  <tr>
                    <td>FIR</td>
                    <td id="screen-kmsFirReceived">--</td>
                    <td id="screen-browserFirSent">--</td>
                  </tr>
                  <tr>
                    <td>PLI</td>
                    <td id="screen-kmsPliReceived">--</td>
                    <td id="screen-browserPliSent">--</td>
                  </tr>
                  <tr>
                    <td>ICE RTT</td>
                    <td id="screen-kmsRtt">--</td>
                    <td id="screen-browserIncomingIceRtt">--</td>
                  </tr>
                  <tr>
                    <td>REMB</td>
                    <td id="screen-kmsRembReceived">--</td>
                    <td id="screen-browserIncomingAvailableBitrate">--</td>
                  </tr>
                </table>
              </div>
            </div>
          </div>
          <div style={{ width: '30%' }}>
            <div style={{ display: 'flex' }}>
              <textarea
                id="message-text"
                placeholder="type here.."
                style={{ marginRight: '5px' }}
              ></textarea>
              <button
                onClick={() => {
                  VideoSDK.sendTextToRoom(
                    document.getElementById('message-text').value
                  );
                  document.getElementById('message-text').value = '';
                }}
              >
                Send
              </button>
            </div>
            <div id="messages" />
          </div>
        </div>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
