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
      name: Math.floor(Math.random() * 2) == 0 ? 'suraj' : 'ahmed',
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
          container.appendChild(video);
          //@ts-ignore

          document.getElementById('participants').appendChild(container);

          var container2 = document.createElement('div');
          container2.appendChild(video.cloneNode(true));
          //@ts-ignore
          document.getElementById('participants').appendChild(container2);
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
        <div id="participants" />
        <button
          onClick={() => {
            console.log(VideoSDK, 'participants here');
            VideoSDK.leaveRoom();
          }}
        >
          Leave room
        </button>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
