const ARTIST_DATA_URLS = {
  2023: "https://raw.githubusercontent.com/bushrow/acl_lineup_explorer/173a9c36f9bfa389912801f395db29ed5c2c9fb5/data/2023/artists.json",
  2024: "https://raw.githubusercontent.com/bushrow/acl_lineup_explorer/173a9c36f9bfa389912801f395db29ed5c2c9fb5/data/2024/artists.json"
}

document.addEventListener("DOMContentLoaded", function () {
  // Fetch JSON data
  fetch(ARTIST_DATA_URLS[2024])
    .then(response => response.json())
    .then(data => {
      const lineup = document.getElementById('lineup-content');

      // Loop through each artist in the JSON data
      data.forEach(artist => {
        // Create artist element
        const artistElement = document.createElement('div');
        artistElement.classList.add('artist');
        if (artist.lineup.headliner) {
          artistElement.classList.add('headliner');
        }
        if (artist.lineup.weekend_one) {
          artistElement.classList.add('weekend_one');
        }
        if (artist.lineup.weekend_two) {
          artistElement.classList.add('weekend_two');
        }
        const header = document.createElement('h2');
        header.innerHTML = `<a class="tooltip" href="${artist.spotify.url}" target="_blank" data-tooltip="${artist.lineup.artist}">${artist.spotify.name}</a>`;
        header.tooltip
        artistElement.appendChild(header);

        const detail = document.createElement('div');
        detail.innerHTML = `
          <p>Genre: ${artist.spotify.genres[0]}</p>
          <p>Popularity: ${artist.spotify.popularity}</p>
          <p>Spotify Followers: ${artist.spotify.followers}</p>
        `;
        artistElement.appendChild(detail);

        const tracks = document.createElement('div');
        const tracksHeader = document.createElement('h3');
        tracksHeader.innerText = 'Top Tracks:';
        tracks.appendChild(tracksHeader);
        const tracksList = document.createElement('ul');
        tracksList.innerHTML = artist.spotify.top_tracks.map(
          track => `<li><a href="${track.url}" target="_blank">${track.name}</a><button class="play-button" onclick="toggleAudio('${track.preview_url}', this)">▶️</button></li>`
        ).join('');
        tracks.appendChild(tracksList);
        artistElement.appendChild(tracks);
        lineup.appendChild(artistElement);
      });
    })
    .catch(error => console.error('Error fetching artists data:', error));
});

let playingAudio = null;
let playingButton = null;

function toggleAudio(audioUrl, currentButton) {
  if (!audioUrl || audioUrl === 'null') {
    alert('broken link');
    return;
  }
  if (playingAudio) {
    if (!playingAudio.paused) {
      playingAudio.pause();
      playingButton.innerText = "▶️";
    } else if (currentButton === playingButton) {
      playingAudio.play();
      playingButton.innerText = "⏸️"
    }
  }

  if (!playingAudio || playingButton !== currentButton) {
    playingAudio = new Audio(audioUrl);
    playingAudio.addEventListener('ended', () => {
      playingButton.innerText = "▶️";
      playingAudio = null;
      playingButton = null;
    });

    playingAudio.play();
    currentButton.innerText = "⏸️";
    playingButton = currentButton;
  }
}