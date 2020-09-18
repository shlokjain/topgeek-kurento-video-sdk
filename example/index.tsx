import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { data, Video } from '../src';
import { forEach } from 'lodash';
// const App = () => {
//   return <div>{data}</div>;
// };

const VideoSDK = new Video();
window['video'] = VideoSDK;
class App extends React.Component<any, any> {
  componentDidMount() {
    console.log(VideoSDK);

    VideoSDK.connect('token', {
      url: 'https://localhost:3000/',
      name: `Suraj` + Math.floor(Math.random() * 10),
      roomName: 'new',
    })
      .then((room: any) => {
        forEach(room.participants, participant => {
          console.log(participant, 'data here');
        });

        room.on('participantConnected', participantConnected => {
          //
          console.log('participantConnected', participantConnected);

          var container = document.createElement('div');

          let name = participantConnected.name;
          // container.id = name;
          var span = document.createElement('span');
          // var video = participantConnected.video;
          // var screen = document.createElement('video');

          // // container.onclick = switchContainerClass;
          span.appendChild(document.createTextNode(name));
          container.appendChild(span);

          //@ts-ignore

          var video = participantConnected.getVideoElement();

          // if (name.startsWith('Screen-')) {
          //   video = participantConnected.getScreenElement();
          // }

          video.style.width = '300px';

          // if (participantConnected.name.startsWith('Screen-')) {
          //   console.log('hello here', participantConnected.name);
          //   video = participantConnected.getScreenElement();
          // }

          // if (participantConnected.name === )
          // video.style.transform = 'rotateY(180deg)';
          // video.style['-webkit-transform'] = 'rotateY(180deg)';

          container.appendChild(video);
          //@ts-ignore

          document.getElementById('participants').appendChild(container);

          //@ts-ignore
          // document.getElementById('participants').appendChild(container2);
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
        <video
          id="share-screen-video"
          style={{
            display: 'none',
          }}
          autoplay="autoplay"
          width="400"
        ></video>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
