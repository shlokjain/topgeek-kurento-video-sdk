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

  componentDidMount() {
    console.log(VideoSDK);

    VideoSDK.connect('token', {
      // url: 'https://176.9.72.40:3000/',
      url: 'https://localhost/',
      name: `Suraj` + Math.floor(Math.random() * 100),
      // name: `Suraj`,
      roomName: 'new',
      videoEnabled: true,
      audioEnabled: true,
      recording: true,
    })
      .then(async (room: any) => {
        forEach(room.participants, participant => {
          console.log(participant, 'data here');
        });

        room.on('participantConnected', async participantConnected => {
          let name = participantConnected.name;

          var container = document.createElement('div');

          container.className = 'canvas-wrapper';
          container.style.display = 'flex';
          container.id = 'video-' + name;

          var span = document.createElement('span');

          span.appendChild(document.createTextNode(name));
          container.appendChild(span);

          //@ts-ignore
          var video = participantConnected.getVideoElement();

          video.style.width = '300px';
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
  render() {
    return (
      <div>
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
            console.log('speech ::: start here', 'participants here');

            // final_transcript = '';
            // this.recognition.lang = select_dialect.value;
            // recognition.start();

            this.recognition.start();
          }}
        >
          start
        </button>
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
            id="share-screen-video"
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

        <button
          onClick={() => {
            // this.recognition.start();
            VideoSDK.startPlaying();
          }}
        >
          play remote video
        </button>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
