#!/usr/bin/env python3
"""Export multiple first-person trajectories per TouchWorld task for case panels."""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image
import zarr


FPS = 30
VIDEO_SIZE = (640, 360)


def as_rgb_image(array: Any) -> Image.Image:
    image = Image.fromarray(np.asarray(array))
    if image.mode != "RGB":
        image = image.convert("RGB")
    return image


def write_video(group: Any, start: int, end: int, output_path: Path, poster_path: Path, crf: int) -> None:
    command = [
        "ffmpeg",
        "-y",
        "-loglevel",
        "error",
        "-f",
        "rawvideo",
        "-vcodec",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-s",
        f"{VIDEO_SIZE[0]}x{VIDEO_SIZE[1]}",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-an",
        "-vcodec",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-profile:v",
        "main",
        "-preset",
        "veryfast",
        "-crf",
        str(crf),
        "-movflags",
        "+faststart",
        str(output_path),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert process.stdin is not None

    for frame_index, source_index in enumerate(range(start, end)):
        image = as_rgb_image(group["data/camera_main_rgb"][source_index])
        image = image.resize(VIDEO_SIZE, Image.Resampling.LANCZOS)
        if frame_index == 0:
            image.save(poster_path, format="JPEG", quality=86, optimize=True)
        process.stdin.write(np.asarray(image, dtype=np.uint8).tobytes())

    process.stdin.close()
    return_code = process.wait()
    if return_code != 0:
        raise RuntimeError(f"ffmpeg failed for {output_path} with exit code {return_code}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        default="/data_all/intern10/egoscale/ftp1-policy/data/wuji_stage2",
        help="Directory containing per-task .zarr datasets.",
    )
    parser.add_argument(
        "--output",
        default="/data_all/intern10/egoscale/ftp1-policy/enpire-research.github.io/public/touchworld/cases",
        help="Output directory under the website public folder.",
    )
    parser.add_argument(
        "--tasks",
        default="",
        help="Optional comma-separated task ids to export. Defaults to every .zarr under --source.",
    )
    parser.add_argument("--episodes", default="0,1,2,3", help="Comma-separated episode indices per task.")
    parser.add_argument("--crf", type=int, default=23, help="H.264 quality setting; lower is higher quality/larger file.")
    args = parser.parse_args()

    source_root = Path(args.source).expanduser().resolve()
    output_root = Path(args.output).expanduser().resolve()
    episode_indices = [int(item) for item in args.episodes.split(",") if item.strip()]
    requested_tasks = {item.strip() for item in args.tasks.split(",") if item.strip()}

    for zarr_path in sorted(source_root.glob("*.zarr")):
        task_id = zarr_path.stem
        if requested_tasks and task_id not in requested_tasks:
            continue
        group = zarr.open(str(zarr_path), mode="r")
        episode_ends = np.asarray(group["meta/episode_ends"])
        task_output = output_root / task_id
        task_output.mkdir(parents=True, exist_ok=True)

        for episode_index in episode_indices:
            if episode_index >= len(episode_ends):
                continue
            start = int(episode_ends[episode_index - 1]) if episode_index > 0 else 0
            end = int(episode_ends[episode_index])
            video_path = task_output / f"episode_{episode_index:02d}.mp4"
            poster_path = task_output / f"episode_{episode_index:02d}.jpg"
            print(f"Exporting {task_id} episode {episode_index} ({end - start} frames)...", flush=True)
            write_video(group, start, end, video_path, poster_path, args.crf)


if __name__ == "__main__":
    main()
