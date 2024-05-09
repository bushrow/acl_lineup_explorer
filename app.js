const ARTIST_DATA_URLS = {
  2023: "https://raw.githubusercontent.com/bushrow/acl_lineup_explorer/main/data/2023/artists.json",
  2024: "https://raw.githubusercontent.com/bushrow/acl_lineup_explorer/main/data/2024/artists.json"
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
        const header = document.createElement('div');
        header.classList.add('header')
        const headerTitle = document.createElement('h2');
        const headerLink = document.createElement('a');
        headerLink.classList.add("tooltip");
        headerLink.href = artist.spotify.url;
        headerLink.target = "_blank";
        headerLink.setAttribute("data-tooltip", artist.spotify.name);
        headerLink.innerText = artist.lineup.artist;
        headerTitle.appendChild(headerLink);

        const popularity = document.createElement('span');
        popularity.classList.add('tooltip');
        popularity.setAttribute('data-tooltip', 'Spotify "Popularity"')
        popularity.classList.add('popularity');
        if (artist.spotify.popularity > 70) {
          popularity.classList.add('green');
        } else if (artist.spotify.popularity > 50) {
          popularity.classList.add('yellow');
        } else if (artist.spotify.popularity > 30) {
          popularity.classList.add('orange');
        } else {
          popularity.classList.add('red');
        }
        popularity.textContent = artist.spotify.popularity;
        headerTitle.appendChild(popularity);

        const followers = document.createElement('span');
        followers.classList.add('tooltip');
        followers.setAttribute('data-tooltip', 'Spotify Followers')
        followers.classList.add('followers');
        followers.textContent = artist.spotify.followers.toLocaleString();
        headerTitle.appendChild(followers);

        if (artist.lineup.weekend_one) {
          const weekend_one = document.createElement('span');
          weekend_one.classList.add('weekend');
          weekend_one.classList.add('w1');
          weekend_one.textContent = 'W1';
          headerTitle.appendChild(weekend_one);
        }
        if (artist.lineup.weekend_two) {
          const weekend_two = document.createElement('span');
          weekend_two.classList.add('weekend');
          weekend_two.classList.add('w2');
          weekend_two.textContent = 'W2';
          headerTitle.appendChild(weekend_two);
        }
        header.appendChild(headerTitle);

        const detail = document.createElement('div');
        artist.spotify.genres.forEach(genre => {
          const ele = document.createElement('span');
          ele.classList.add('genre')
          ele.textContent = genre;
          detail.appendChild(ele);
        });
        header.appendChild(detail);
        artistElement.appendChild(header);

        const tracks = document.createElement('div');
        const tracksHeader = document.createElement('span');
        tracksHeader.classList.add('tracks-header');
        tracksHeader.textContent = 'show/hide top tracks +';
        tracksHeader.onclick = () => { toggleCollapse(artist.spotify.id); }
        tracks.appendChild(tracksHeader);
        const tracksList = document.createElement('ol');
        tracksList.classList.add('tracks-list');
        tracksList.id = artist.spotify.id;
        tracksList.innerHTML = artist.spotify.top_tracks.map(
          track => `<li><a href="${track.url}" target="_blank">${track.name}</a>${!track.preview_url ? '' : '<button class="play-button" onclick="toggleAudio(\'' + track.preview_url + '\', this)">▶️</button>'}</li>`
        ).join('');
        tracks.appendChild(tracksList);
        artistElement.appendChild(tracks);
        lineup.appendChild(artistElement);
      });
    })
    .catch(error => console.error('Error fetching artists data:', error));
});


function filterItems(select) {
  var artists = document.getElementsByClassName('artist');
  for (var i = 0; i < artists.length; i++) {
    var artist = artists[i];
    if (select.value === 'all' || (artist.classList.contains(select.value) && !select.value.endsWith('only'))) {
      artist.style.display = 'block';
    } else if (select.value.endsWith('only')) {
      if (select.value.slice(0, -5) === 'weekend_one') {
        if (artist.classList.contains('weekend_one') && !artist.classList.contains('weekend_two')) {
          artist.style.display = 'block';
        } else {
          artist.style.display = 'none';
        }
      } else if (select.value.slice(0, -5) === 'weekend_two') {
        if (!artist.classList.contains('weekend_one') && artist.classList.contains('weekend_two')) {
          artist.style.display = 'block';
        } else {
          artist.style.display = 'none';
        }
      }
    } else {
      artist.style.display = 'none';
    }
  }
}

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

function toggleCollapse(id) {
  var content = document.getElementById(id);
  content.classList.toggle("tracks-visible");
}