import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

import styles from './index.css';
import artistsData from '../../data/2024/artists.json';
import ArtistCard from './components/ArtistCard/ArtistCard';

function Lineup() {
  const [filterWeekend, setFilterWeekend] = useState('');
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);
  const [showingTopTracksIndex, setShowingTopTracksIndex] = useState(null);

  const handleFilterChange = (event) => {
    setFilterWeekend(event.target.value);
  };

  const handleToggleTracks = (artistIndex) => {
    setShowingTopTracksIndex((prevArtistIndex) => (prevArtistIndex === artistIndex ? null : artistIndex));
  };

  const handleTogglePlay = (trackId) => {
    setCurrentlyPlayingId((prevTrackId) => (prevTrackId === trackId ? null : trackId));
  };

  return (
    <div>
      <h1>ACL Festival Lineup</h1>
      <div className='lineup-selectors'>
        <label>
          Filter by Weekend:
          <select className='weekend-selector' value={filterWeekend} onChange={handleFilterChange}>
            <option value="">All</option>
            <option value="weekend_one">Weekend One</option>
            <option value="weekend_two">Weekend Two</option>
            <option value="weekend_one_only">Weekend One ONLY</option>
            <option value="weekend_two_only">Weekend Two ONLY</option>
          </select>
        </label>
      </div>
      <div className="lineup">
        {artistsData
          .filter((artist) => {
            if (!filterWeekend) {
              return true;
            } else if (filterWeekend.endsWith('only')) {
              var weekend = filterWeekend.slice(0, -5)
              if (weekend === 'weekend_one') {
                return artist.lineup.weekend_one && !artist.lineup.weekend_two;
              } else {
                return !artist.lineup.weekend_one && artist.lineup.weekend_two;
              }
            } else {
              return artist.lineup[filterWeekend];
            }
          })
          .map((artist, index) => (
            <ArtistCard
              key={index}
              artistIndex={index}
              artist={artist}
              isShowingTopTracks={showingTopTracksIndex === index}
              onToggleTracks={handleToggleTracks}
              trackIdPlaying={currentlyPlayingId}
              onTogglePlay={handleTogglePlay}
            />
          ))}
      </div>
    </div>
  );
}

// Create a root using createRoot
const root = ReactDOM.createRoot(document.getElementById('lineup-content'));

// Render the App component inside the root
root.render(<Lineup />);
