#!/usr/bin/env python3
"""Export full first-person TouchWorld task videos for the policy gallery."""

from __future__ import annotations

import argparse
import json
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


def write_main_camera_video(group: Any, indices: list[int], output_path: Path, poster_path: Path, crf: int) -> None:
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

    for frame_index, source_index in enumerate(indices):
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
        default="/data_all/intern10/egoscale/ftp1-policy/enpire-research.github.io/public/touchworld/demos",
        help="Output directory under the website public folder.",
    )
    parser.add_argument("--episode-index", type=int, default=0, help="Episode index to export from each task zarr.")
    parser.add_argument("--crf", type=int, default=23, help="H.264 quality setting; lower is higher quality/larger file.")
    args = parser.parse_args()

    source_root = Path(args.source).expanduser().resolve()
    output_root = Path(args.output).expanduser().resolve()
    manifest_path = output_root / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {"tasks": []}
    tasks_by_id = {task["id"]: task for task in manifest.get("tasks", [])}

    for zarr_path in sorted(source_root.glob("*.zarr")):
        task_id = zarr_path.stem
        group = zarr.open(str(zarr_path), mode="r")
        episode_ends = np.asarray(group["meta/episode_ends"])
        start = int(episode_ends[args.episode_index - 1]) if args.episode_index > 0 else 0
        end = int(episode_ends[args.episode_index])
        indices = list(range(start, end))

        task_output = output_root / task_id
        task_output.mkdir(parents=True, exist_ok=True)
        video_path = task_output / "main_camera.mp4"
        poster_path = task_output / "main_camera_poster.jpg"
        print(f"Exporting first-person video for {task_id} ({len(indices)} frames)...", flush=True)
        write_main_camera_video(group, indices, video_path, poster_path, args.crf)

        if task_id in tasks_by_id:
            tasks_by_id[task_id]["mainVideo"] = f"/touchworld/demos/{task_id}/main_camera.mp4"
            tasks_by_id[task_id]["mainPoster"] = f"/touchworld/demos/{task_id}/main_camera_poster.jpg"

    if tasks_by_id:
        manifest["tasks"] = list(tasks_by_id.values())
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        print(f"Updated {manifest_path}", flush=True)


if __name__ == "__main__":
    main()
