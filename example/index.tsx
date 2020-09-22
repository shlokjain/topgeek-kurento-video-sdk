import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { data, Video } from '../src';
import { forEach } from 'lodash';

import { ScatterGL } from 'scatter-gl';
import { TRIANGULATION } from './triangulation';
// const App = () => {
//   return <div>{data}</div>;
// };

require('./index.css');

const facemesh = require('@tensorflow-models/facemesh');
require('@tensorflow/tfjs-backend-webgl');
console.log(ScatterGL);

const VideoSDK = new Video();
window['video'] = VideoSDK;
class App extends React.Component<any, any> {
  scatterGLHasInitialized: boolean = false;
  model: any;
  scatterGL: ScatterGL;
  videoWidth: string;
  videoHeight: string;
  ctx: any;
  canvas: any;
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

    // setTimeout(() => {
    //   this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    // }, 200);

    console.log(predictions.length, 'length');
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

      // if (this.scatterGL != null) {
      //   const pointsData = predictions.map(prediction => {
      //     let scaledMesh = prediction.scaledMesh;
      //     return scaledMesh.map(point => [-point[0], -point[1], -point[2]]);
      //   });

      //   let flattenedPointsData = [];
      //   for (let i = 0; i < pointsData.length; i++) {
      //     flattenedPointsData = flattenedPointsData.concat(pointsData[i]);
      //   }
      //   const dataset = new ScatterGL.Dataset(flattenedPointsData);

      //   console.log('hellol here', this.scatterGLHasInitialized);
      //   if (!this.scatterGLHasInitialized) {
      //     // this.scatterGL.render(dataset);
      //   } else {
      //     // this.scatterGL.updateDataset(dataset);
      //   }
      //   this.scatterGLHasInitialized = true;
      // }
    }

    requestAnimationFrame(
      this.renderPrediction.bind(this, canvas, ctx, participant, model)
    );
  };
  componentDidMount() {
    console.log(VideoSDK);

    VideoSDK.connect('token', {
      url: 'https://176.9.72.40:3000/',
      name: `Suraj` + Math.floor(Math.random() * 10),
      roomName: 'new',
    })
      .then(async (room: any) => {
        forEach(room.participants, participant => {
          console.log(participant, 'data here');
        });

        room.on('participantConnected', async participantConnected => {
          //
          console.log('participantConnected', participantConnected);

          var container = document.createElement('div');

          container.className = 'canvas-wrapper';
          container.style.display = 'flex';

          let name = participantConnected.name;
          // container.id = name;
          var span = document.createElement('span');
          // var video = participantConnected.video;
          // var screen = document.createElement('video');

          // // container.onclick = switchContainerClass;
          // span.appendChild(document.createTextNode(name));
          // container.appendChild(span);

          //@ts-ignore

          var video = participantConnected.getVideoElement();

          // if (name.startsWith('Screen-')) {
          //   video = participantConnected.getScreenElement();
          // }

          // video.style.width = '300px';

          // if (participantConnected.name.startsWith('Screen-')) {
          //   console.log('hello here', participantConnected.name);
          //   video = participantConnected.getScreenElement();
          // }

          // if (participantConnected.name === )
          // video.style.transform = 'rotateY(180deg)';
          // video.style['-webkit-transform'] = 'rotateY(180deg)';

          var canvas: any = document.createElement('canvas');
          canvas.id = 'output-' + participantConnected.name;

          container.appendChild(video);
          container.appendChild(canvas);

          //@ts-ignore
          document.getElementById('participants').appendChild(container);

          //

          // this.canvas = document.getElementById('output');

          // if (!this.canvas) {
          //   return;
          // }
          setTimeout(async () => {
            this.videoWidth = '320'; //video.getBoundingClientRect().width;
            this.videoHeight = '240'; //video.getBoundingClientRect().height;

            canvas.width = this.videoWidth;
            canvas.height = this.videoHeight;

            const canvasContainer: any = document.querySelector(
              '.canvas-wrapper'
            );

            canvasContainer.style.width = this.videoWidth + 'px';
            canvasContainer.style.height = this.videoHeight + 'px';
            const ctx = canvas.getContext('2d');

            // this.ctx.translate(canvas.width, 0);
            // this.ctx.scale(-1, 1);

            if (!ctx) {
              return;
            }
            ctx.fillStyle = '#32EEDB';
            ctx.strokeStyle = '#32EEDB';
            ctx.lineWidth = 0.5;

            const model = await facemesh.load({ maxFaces: 1 });
            // const scattergl: any = document.querySelector(
            //   '#scatter-gl-container'
            // );

            // if (!scattergl) {
            //   return;
            // }
            // this.scatterGL = new ScatterGL(scattergl, {
            //   rotateOnStart: false,
            //   selectEnabled: false,
            // });
            this.renderPrediction(canvas, ctx, participantConnected, model);
          }, 1000);
        });

        room.on('participantDisconnected', participant => {
          console.log('participant disconnected');
          //
        });

        room.on('disconnected', error => {
          console.log('room disconnected');

          room.participants.forEach(participant => {
            //
          });
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
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
