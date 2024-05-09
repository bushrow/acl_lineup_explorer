import requests
import urllib.parse
from typing import Dict, List, Tuple


class SpotifyLinker:
    BASE_URL = "https://api.spotify.com/v1/"

    def __init__(self, client_id: str, client_secret: str):
        self._headers = {}
        self.client_tokens = client_id, client_secret

    @property
    def client_tokens(self):
        return self._client_id, self.__client_secret

    @client_tokens.setter
    def client_tokens(self, new_client_tokens: Tuple[str, str]):
        self._client_id = new_client_tokens[0]
        self.__client_secret = new_client_tokens[1]
        self.refresh_token()

    def refresh_token(self) -> str:
        client_id, client_secret = self.client_tokens
        auth_response = requests.post(
            "https://accounts.spotify.com/api/token",
            {
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret,
            },
        )
        auth_response_data = auth_response.json()
        self._token = auth_response_data["access_token"]
        self._headers["Authorization"] = "Bearer {token}".format(token=self._token)

    def _get_artist_data(self, artist_name) -> Dict[str, str]:
        urlified_artist_name = urllib.parse.quote_plus(artist_name)
        search_url = f"{self.BASE_URL}search?type=artist&q={urlified_artist_name}"
        r = requests.get(search_url, headers=self._headers)
        artist_data = r.json()["artists"]["items"][0]
        artist_data_clean = {
            "name": artist_data["name"],
            "id": artist_data["id"],
            "url": artist_data["external_urls"]["spotify"],
            "genres": artist_data["genres"],
            "followers": artist_data["followers"]["total"],
            "popularity": artist_data["popularity"],
        }
        return artist_data_clean

    def _get_artist_top_tracks(self, artist_id) -> List[dict]:
        tracks_url = f"{self.BASE_URL}artists/{artist_id}/top-tracks"
        r = requests.get(
            tracks_url,
            headers=self._headers,
            params={"include_groups": "track", "limit": 10},
        )
        tracks_data = r.json()["tracks"]
        tracks_data_clean = [
            {
                "name": track_data["name"],
                "id": track_data["id"],
                "url": track_data["external_urls"]["spotify"],
                "preview_url": track_data["preview_url"],
                "artists": [
                    {"name": a["name"], "url": a["external_urls"]["spotify"]}
                    for a in track_data["artists"]
                ],
                "popularity": track_data["popularity"],
            }
            for track_data in tracks_data
        ]
        return tracks_data_clean

    def load_data_for_artist(self, artist_name):
        artist_data = self._get_artist_data(artist_name)
        artist_id = artist_data["id"]
        top_tracks = self._get_artist_top_tracks(artist_id)
        artist_data["top_tracks"] = top_tracks
        return artist_data
