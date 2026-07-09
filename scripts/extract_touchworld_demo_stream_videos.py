#!/usr/bin/env python3
"""Export synchronized per-stream videos for the TouchWorld dataset explorer."""

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

STREAMS = {
    "main": ("camera_main_rgb", (640, 360)),
    "leftWrist": ("left_wrist_camera_rgb", (320, 180)),
    "rightWrist": ("right_wrist_camera_rgb", (320, 180)),
    "tactile": ("tactile_image", (320, 160)),
    "subgoal": ("pred_goal_grid_rgb", (320, 176)),
}


def as_rgb_image(array: Any) -> Image.Image:
    image = Image.fromarray(np.asarray(array))
    if image.mode != "RGB":
        image = image.convert("RGB")
    return image


def write_stream_video(
    group: Any,
    field: str,
    size: tuple[int, int],
    start: int,
    end: int,
    output_path: Path,
    poster_path: Path,
    crf: int,
) -> None:
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
        f"{size[0]}x{size[1]}",
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
        image = as_rgb_image(group[f"data/{field}"][source_index]).resize(size, Image.Resampling.LANCZOS)
        if frame_index == 0:
            image.save(poster_path, format="JPEG", quality=86, optimize=True)
        process.stdin.write(np.asarray(image, dtype=np.uint8).tobytes())

    process.stdin.close()
    return_code = process.wait()
    if return_code != 0:
        raise RuntimeError(f"ffmpeg failed for {output_path} with exit code {return_code}")


def public_stream_paths(task_id: str) -> dict[str, str]:
    paths = {"overview": f"/touchworld/demos/{task_id}/trajectory.mp4"}
    paths.update({stream_id: f"/touchworld/demos/{task_id}/{stream_id}.mp4" for stream_id in STREAMS})
    return paths


def public_poster_paths(task_id: str) -> dict[str, str]:
    paths = {"overview": f"/touchworld/demos/{task_id}/poster.jpg"}
    paths.update({stream_id: f"/touchworld/demos/{task_id}/{stream_id}.jpg" for stream_id in STREAMS})
    return paths


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
    parser.add_argument("--crf", type=int, default=24, help="H.264 quality setting; lower is higher quality/larger file.")
    parser.add_argument(
        "--tasks",
        default=None,
        help="Optional comma-separated task ids to export from the source directory.",
    )
    args = parser.parse_args()

    source_root = Path(args.source).expanduser().resolve()
    output_root = Path(args.output).expanduser().resolve()
    manifest_path = output_root / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    tasks_by_id = {task["id"]: task for task in manifest["tasks"]}

    selected_tasks = {task.strip() for task in args.tasks.split(",")} if args.tasks else None
    zarr_paths = sorted(source_root.glob("*.zarr"))
    if selected_tasks is not None:
        zarr_paths = [path for path in zarr_paths if path.stem in selected_tasks]
    if not zarr_paths:
        raise FileNotFoundError(f"No matching .zarr task directories found in {source_root}")

    for zarr_path in zarr_paths:
        task_id = zarr_path.stem
        group = zarr.open(str(zarr_path), mode="r")
        episode_ends = np.asarray(group["meta/episode_ends"])
        start = int(episode_ends[args.episode_index - 1]) if args.episode_index > 0 else 0
        end = int(episode_ends[args.episode_index])
        task_output = output_root / task_id
        task_output.mkdir(parents=True, exist_ok=True)

        for stream_id, (field, size) in STREAMS.items():
            output_path = task_output / f"{stream_id}.mp4"
            poster_path = task_output / f"{stream_id}.jpg"
            print(f"Exporting {task_id} {stream_id} ({end - start} frames)...", flush=True)
            write_stream_video(group, field, size, start, end, output_path, poster_path, args.crf)

        if task_id in tasks_by_id:
            tasks_by_id[task_id]["streams"] = public_stream_paths(task_id)
            tasks_by_id[task_id]["streamPosters"] = public_poster_paths(task_id)

    manifest["tasks"] = list(tasks_by_id.values())
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Updated {manifest_path}", flush=True)


if __name__ == "__main__":
    main()
