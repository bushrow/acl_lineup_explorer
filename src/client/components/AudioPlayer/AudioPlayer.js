import React, { useRef, useState, useEffect } from 'react';

import styles from './AudioPlayer.css';

const AudioPlayer = ({ trackId, src, isPlaying, onTogglePlay }) => {
  const audioRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const handleClick = () => {
    if (!src) {
      alert('BROKEN LINK');
      return;
    }
    onTogglePlay(trackId);
  };

  return (
    <span className='audio-sample' onClick={handleClick}>
      <audio ref={audioRef} src={src} onLoadStart={() => setIsLoading(true)} onCanPlay={() => setIsLoading(false)}></audio>
      {isPlaying ? "⏸️" : isLoading ? '⏳' : "▶️"}
    </span>
  );
};

export default AudioPlayer;