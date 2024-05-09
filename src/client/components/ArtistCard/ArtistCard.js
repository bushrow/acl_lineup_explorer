import React, { useRef, useEffect } from 'react';

import styles from './ArtistCard.css';
import AudioPlayer from '../AudioPlayer/AudioPlayer';


const ArtistCard = ({ artistIndex, artist, isShowingTopTracks, onToggleTracks, trackIdPlaying, onTogglePlay }) => {
  const { lineup, spotify } = artist;

  const tracksRef = useRef(null);

  useEffect(() => {
    if (isShowingTopTracks) {
      tracksRef.current.className = 'tracks-visible';
    } else {
      tracksRef.current.className = 'tracks-hidden';
    }
  }, [isShowingTopTracks]);

  const handleToggleTracks = () => {
    onToggleTracks(artistIndex)
  }
  const handleTogglePlay = (trackId) => {
    onTogglePlay(trackId);
  };

  return (
    <div className="artist-card">
      <div className='header'>
        <h2>
          <a title={spotify.name} href={spotify.url} target='_blank'>{lineup.artist}</a>
          <span title='Spotify "Popularity"' className={`popularity ${spotify.popularity > 70 ? 'green' : spotify.popularity > 50 ? 'yellow' : spotify.popularity > 30 ? 'orange' : 'red'}`}>{spotify.popularity}</span>
          <span title='Spotify Followers' className='followers' >{spotify.followers.toLocaleString()}</span>
          {lineup.weekend_one && <span title='Weekend One' className='weekends w1'>W1</span>}
          {lineup.weekend_two && <span title='Weekend Two' className='weekends w2'>W2</span>}
        </h2>
      </div>

      <div className='genres'>{spotify.genres.map((genre, index) => (<span className='genre'>{genre}</span>))}</div>
      <span onClick={handleToggleTracks} className='tracks-header'>Show/Hide Top Tracks +</span>
      <div ref={tracksRef} className='tracks-hidden'>
        <ol className='track-items'>
          {spotify.top_tracks.map((track, index) => (
            <li key={index} className='track-item'>
              <a href={track.url} target='_blank'>{track.name}</a>
              {!track.preview_url ? null : <AudioPlayer trackId={track.id} src={track.preview_url} isPlaying={trackIdPlaying === track.id} onTogglePlay={handleTogglePlay} />}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default ArtistCard;