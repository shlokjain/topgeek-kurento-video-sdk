import 'react-app-polyfill/ie11';
import * as React from 'react';
import { useEffect, useState } from 'react';

export default function CurrentMicrophone(props: any) {
  const [text, setText] = useState('Loading...');

  useEffect(() => {
    setText(
      props?.VideoSDK?.currentUser?.track?.srcObject?.getAudioTracks()[0]?.label
    );
  }, [
    props?.VideoSDK?.currentUser?.track?.srcObject?.getAudioTracks()[0]?.label,
  ]);
  return <>{text}</>;
}
