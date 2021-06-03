import 'react-app-polyfill/ie11';
import * as React from 'react';
import { useEffect, useState } from 'react';
import AudioVisualiser from './AudioVisualiser';

export default function AudioAnalyser(props: any) {
  const getAudioContext = () => {
    return new (window.AudioContext ||
      //@ts-ignore
      window.webkitAudioContext)();
  };

  const [audioData, setAudioData] = useState(new Uint8Array(0));
  const [micLabel, setMicLabel]: any = useState('');
  const [audioContext, setAudioContext]: any = useState(getAudioContext());
  const [analyser, setAnalyser]: any = useState(audioContext.createAnalyser());
  let dataArray = new Uint8Array(analyser.frequencyBinCount);
  const [source, setSource]: any = useState();
  const [rafId, setRafId]: any = useState();

  useEffect(() => {
    cancelAnimationFrame(rafId);
    analyser.disconnect();
    if (source) source.disconnect();
    setMicLabel(
      props?.VideoSDK?.currentUser?.track?.srcObject?.getAudioTracks()[0]?.label
    );
  }, [
    props?.VideoSDK?.currentUser?.track?.srcObject?.getAudioTracks()[0]?.label,
  ]);

  useEffect(() => {
    try {
      if (
        props?.VideoSDK?.currentUser?.track?.srcObject &&
        micLabel &&
        micLabel != ''
      ) {
        setSource(
          audioContext.createMediaStreamSource(
            props?.VideoSDK?.currentUser?.track?.srcObject
          )
        );
      }
    } catch (e) {
      console.log('this.props.error micLabel', e);
    }
  }, [micLabel]);

  useEffect(() => {
    if (source) {
      try {
        source.connect(analyser);
        setRafId(requestAnimationFrame(tick));
      } catch (e) {
        console.log('this.props.error source', e);
      }
    }
  }, [source?.mediaStream?.getAudioTracks()[0]?.label]);

  const tick = () => {
    analyser.getByteTimeDomainData(dataArray);
    setAudioData(dataArray);
    setRafId(requestAnimationFrame(tick));
  };

  return <AudioVisualiser {...props} audioData={audioData} />;
}
