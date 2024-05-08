import os
import re
from pathlib import Path
from PIL import Image
from typing import List, Optional, Tuple

import boto3
import numpy as np
from botocore.client import BaseClient


class LineupParser:
    DEFAULT_BLOCK = {
        "Geometry": {"BoundingBox": {"Top": 0, "Height": 0, "Left": 0, "Width": 0}},
        "Text": "",
    }

    def __init__(self, filename: str = "lineup.jpg"):
        self.filename = filename

    @property
    def filename(self):
        return self._filename

    @filename.setter
    def filename(self, new_filename):
        self._filename = new_filename
        self._directory = str(Path(new_filename).parent).rstrip(os.sep)

    def _segment_lineup_image(
        self,
        black_threshold: int = 75,
        header_height_pct_estimate: float = 0.2,
        footer_height_pct_estimate: float = 0.2,
        headliners_width_pct_estimate: float = 0.4,
        headliners_filename: str = "headliners.jpg",
        other_artists_filename: str = "other_artists.jpg",
    ) -> Tuple[str, str]:
        im = Image.open(self.filename).convert("L")
        im_arr = np.array(im)

        blank_rows = [
            ix
            for ix, row in enumerate(im_arr)
            if all(px > black_threshold for px in row)
        ]
        header_end_row = (
            max(
                ln
                for ln in blank_rows
                if ln < (im_arr.shape[0] * header_height_pct_estimate)
            )
            - 1
        )
        footer_start_row = (
            min(
                ln
                for ln in blank_rows
                if ln > (im_arr.shape[0] * (1 - footer_height_pct_estimate))
            )
            + 1
        )
        artists_im_arr = im_arr[header_end_row:footer_start_row]

        blank_cols = [
            ix
            for ix, col in enumerate(artists_im_arr.T)
            if all(px > black_threshold for px in col)
        ]
        headliners_end_col = (
            max(
                col
                for col in blank_cols
                if col < (artists_im_arr.shape[1] * headliners_width_pct_estimate)
            )
            - 1
        )
        headliners_im_arr = im_arr[header_end_row:footer_start_row, :headliners_end_col]
        other_artists_im_arr = im_arr[
            header_end_row:footer_start_row, headliners_end_col:
        ]

        headliners_fn = f"{self._directory}/{headliners_filename}"
        other_artists_fn = f"{self._directory}/{other_artists_filename}"
        Image.fromarray(headliners_im_arr).save(headliners_fn)
        Image.fromarray(other_artists_im_arr).save(other_artists_fn)
        return headliners_fn, other_artists_fn

    def _extract_vertical_artist_names(
        self,
        image_filename,
        boto_client: Optional[BaseClient] = None,
        sep_height_threshold: float = 0.005,
    ) -> List[str]:
        boto_client = boto_client or boto3.client("textract")
        with open(image_filename, "rb") as rdr:
            image_bytes = rdr.read()
        textract_result = boto_client.detect_document_text(
            Document={"Bytes": image_bytes}
        )

        blocks = [
            block for block in textract_result["Blocks"] if block["BlockType"] == "LINE"
        ]

        artist_names = []
        current_text = ""
        prev_block = self.DEFAULT_BLOCK.copy()
        for block in blocks:
            prev_bb = prev_block["Geometry"]["BoundingBox"]
            bb = block["Geometry"]["BoundingBox"]
            prev_bottom = prev_bb["Top"] + prev_bb["Height"]
            if (bb["Top"] - prev_bottom) < sep_height_threshold:
                current_text += " " + block["Text"]
            else:
                artist_names.append(current_text.strip())
                current_text = block["Text"]
            prev_block = block
        artist_names.append(current_text.strip())

        return artist_names

    def _extract_horizontal_artist_names(
        self,
        image_filename: str,
        boto_client: Optional[BaseClient] = None,
    ) -> List[List[str]]:
        boto_client = boto_client or boto3.client("textract")

        with open(image_filename, "rb") as rdr:
            image_bytes = rdr.read()
        textract_result = boto_client.detect_document_text(
            Document={"Bytes": image_bytes}
        )
        word_id_lines = {
            id_: ln
            for ln, block in enumerate(
                [
                    block
                    for block in textract_result["Blocks"]
                    if block["BlockType"] == "LINE"
                ]
            )
            for id_ in block.get("Relationships", [{}])[0].get("Ids", [])
        }

        line_word_blocks_dict = {}
        for block in textract_result["Blocks"]:
            if block["BlockType"] != "WORD":
                continue
            ln = word_id_lines[block["Id"]]
            line_word_blocks_dict.setdefault(ln, []).append(block)

        artist_names = []
        for line_word_blocks in line_word_blocks_dict.values():
            line_spacing = []
            prev_right = 0
            for word_block in line_word_blocks_dict[0]:
                word = word_block["Text"]
                if word in "+.*":
                    continue
                bb = word_block["Geometry"]["BoundingBox"]
                line_spacing.append(bb["Left"] - prev_right)
                prev_right = bb["Left"] + bb["Width"]

            line_spacing = sorted(line_spacing)
            max_diff = 0
            s = 0
            for s1, s2 in zip(line_spacing[:-1], line_spacing[1:]):
                diff = s2 - s1
                if diff >= max_diff:
                    max_diff = diff
                    s = s2
            line_sep_width_threshold = round(s * 0.9, 3)

            line_artist_names = []
            current_text = ""
            prev_word_block = self.DEFAULT_BLOCK.copy()
            for word_block in line_word_blocks:
                word = word_block["Text"]
                if word in "+.*":
                    continue
                if word.startswith("[W"):
                    current_text += " " + word
                    continue

                prev_bb = prev_word_block["Geometry"]["BoundingBox"]
                bb = word_block["Geometry"]["BoundingBox"]
                prev_right = prev_bb["Left"] + prev_bb["Width"]
                if (bb["Left"] - prev_right) < line_sep_width_threshold:
                    current_text += " " + word
                else:
                    line_artist_names.append(current_text.strip())
                    current_text = word_block["Text"]
                prev_word_block = word_block
            line_artist_names.append(current_text.strip())
            artist_names.append(line_artist_names)

        return artist_names

    def parse_lineup(self, output_filenames=("headliners", "other_artists")):
        headliners_fn, other_artists_fn = self._segment_lineup_image(
            headliners_filename=f"{output_filenames[0]}.jpg",
            other_artists_filename=f"{output_filenames[1]}.jpg",
        )
        headliner_names = self._extract_vertical_artist_names(
            image_filename=headliners_fn
        )
        other_artist_names = self._extract_horizontal_artist_names(
            image_filename=other_artists_fn
        )

        with open(f"{self._directory}/{output_filenames[0]}.txt", "w") as wrtr:
            for name in headliner_names:
                wrtr.write(name + "\n")

        with open(f"{self._directory}/{output_filenames[1]}.txt", "w") as wrtr:
            for row in other_artist_names:
                for name in row:
                    wrtr.write(name + "\n")

    @staticmethod
    def _parse_weekends_from_artist_name(artist_name):
        weekend_pattern = r".+((?: ?WEEKEND | ?\[W)([1I2])(?: ONLY|\]))$"
        match = re.match(weekend_pattern, artist_name)
        if match is None:
            name = artist_name
            weekend_one = True
            weekend_two = True
        else:
            name = artist_name[: match.span(1)[0]]
            weekend_num = match.group(2)
            weekend_one = weekend_num in "1I"
            weekend_two = weekend_num == "2"
        return name.strip(), weekend_one, weekend_two

    def parse_artist_names(
        self,
        input_filenames: Tuple[str, str] = ("headliners.txt", "other_artists.txt"),
        input_directory: Optional[str] = None,
    ) -> List[dict]:
        input_directory = input_directory or self._directory

        with open(f"{input_directory}/{input_filenames[0]}") as rdr:
            headliner_names = [name.strip() for name in rdr.readlines()]

        with open(f"{input_directory}/{input_filenames[1]}") as rdr:
            other_artist_names = [name.strip() for name in rdr.readlines()]

        artist_data = []
        for artist_name in headliner_names + other_artist_names:
            name, weekend_one, weekend_two = self._parse_weekends_from_artist_name(
                artist_name
            )
            artist_dict = {
                "artist": name,
                "headliner": artist_name in headliner_names,
                "weekend_one": weekend_one,
                "weekend_two": weekend_two,
            }
            artist_data.append(artist_dict)

        return artist_data
