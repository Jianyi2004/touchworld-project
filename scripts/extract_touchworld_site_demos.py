#!/usr/bin/env python3
"""Export full TouchWorld trajectories as 30fps website videos."""

from __future__ import annotations

import argparse
import json
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageDraw, ImageFont
import zarr


TASK_LABELS = {
    "grasp_milktea_bottle": "Grasp Milktea Bottle",
    "grasp_water_bottle": "Grasp Water Bottle",
    "insert_plug": "Insert Plug",
    "pull_tissue": "Pull Tissue",
    "scrub_pan": "Scrub Pan",
    "spray_water": "Spray Water",
    "stack_cups": "Stack Cups",
    "wipe_cup": "Wipe Cup",
}

FPS = 30
CANVAS_SIZE = (1280, 720)
PANEL_BG = (4, 4, 4)
TEXT = (246, 246, 239)
MUTED_TEXT = (196, 196, 188)
BORDER = (82, 82, 76)


def task_label(task_id: str) -> str:
    return TASK_LABELS.get(task_id, task_id.replace("_", " ").title())


def public_path(path: Path, public_root: Path) -> str:
    return "/" + path.relative_to(public_root).as_posix()


def as_rgb_image(array: Any) -> Image.Image:
    image = Image.fromarray(np.asarray(array))
    if image.mode != "RGB":
        image = image.convert("RGB")
    return image


def get_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


FONT_LABEL = get_font(20)
FONT_TITLE = get_font(24)


def paste_panel(
    canvas: Image.Image,
    image: Image.Image,
    box: tuple[int, int, int, int],
    label: str,
    *,
    contain: bool = False,
) -> None:
    x, y, width, height = box
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((x, y, x + width, y + height), fill=PANEL_BG, outline=BORDER, width=1)

    if contain:
        image.thumbnail((width, height), Image.Resampling.LANCZOS)
        px = x + (width - image.width) // 2
        py = y + (height - image.height) // 2
        canvas.paste(image, (px, py))
    else:
        canvas.paste(image.resize((width, height), Image.Resampling.LANCZOS), (x, y))

    label_padding = 8
    label_bbox = draw.textbbox((0, 0), label, font=FONT_LABEL)
    label_width = label_bbox[2] - label_bbox[0]
    label_height = label_bbox[3] - label_bbox[1]
    label_box = (
        x + 10,
        y + height - label_height - 20,
        x + label_width + label_padding * 2 + 10,
        y + height - 8,
    )
    draw.rectangle(label_box, fill=(0, 0, 0))
    draw.text((label_box[0] + label_padding, label_box[1] + 4), label, fill=MUTED_TEXT, font=FONT_LABEL)


def compose_frame(group: Any, source_index: int, task_name: str, frame_number: int, total_frames: int) -> Image.Image:
    canvas = Image.new("RGB", CANVAS_SIZE, (12, 12, 12))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), task_name, fill=TEXT, font=FONT_TITLE)
    draw.text((1120, 22), f"{frame_number + 1}/{total_frames}", fill=MUTED_TEXT, font=FONT_LABEL)

    main = as_rgb_image(group["data/camera_main_rgb"][source_index])
    left = as_rgb_image(group["data/left_wrist_camera_rgb"][source_index])
    right = as_rgb_image(group["data/right_wrist_camera_rgb"][source_index])
    tactile = as_rgb_image(group["data/tactile_image"][source_index])
    goal = as_rgb_image(group["data/pred_goal_grid_rgb"][source_index])

    paste_panel(canvas, main, (24, 58, 730, 411), "MAIN CAMERA")
    paste_panel(canvas, left, (24, 493, 230, 129), "LEFT WRIST")
    paste_panel(canvas, right, (272, 493, 230, 129), "RIGHT WRIST")
    paste_panel(canvas, tactile, (520, 493, 234, 117), "TACTILE")
    paste_panel(canvas, goal, (792, 58, 446, 245), "SUBGOAL GRID", contain=False)

    return canvas


def write_video(group: Any, indices: list[int], output_path: Path, poster_path: Path, label: str, crf: int) -> None:
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
        f"{CANVAS_SIZE[0]}x{CANVAS_SIZE[1]}",
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

    for frame_number, source_index in enumerate(indices):
        frame = compose_frame(group, source_index, label, frame_number, len(indices))
        if frame_number == 0:
            frame.save(poster_path, format="JPEG", quality=86, optimize=True)
        process.stdin.write(np.asarray(frame, dtype=np.uint8).tobytes())

    process.stdin.close()
    return_code = process.wait()
    if return_code != 0:
        raise RuntimeError(f"ffmpeg failed for {output_path} with exit code {return_code}")


def extract_task(
    zarr_path: Path,
    output_root: Path,
    public_root: Path,
    episode_index: int,
    crf: int,
    limit_frames: int | None,
) -> dict[str, Any]:
    group = zarr.open(str(zarr_path), mode="r")
    episode_ends = np.asarray(group["meta/episode_ends"])
    if len(episode_ends) == 0:
        raise ValueError(f"{zarr_path} has no episodes")
    if episode_index >= len(episode_ends):
        raise ValueError(f"{zarr_path} has only {len(episode_ends)} episodes; requested {episode_index}")

    start = int(episode_ends[episode_index - 1]) if episode_index > 0 else 0
    end = int(episode_ends[episode_index])
    indices = list(range(start, end))
    if limit_frames is not None:
        indices = indices[:limit_frames]

    task_id = zarr_path.stem
    label = task_label(task_id)
    task_output = output_root / task_id
    task_output.mkdir(parents=True, exist_ok=True)
    video_path = task_output / "trajectory.mp4"
    poster_path = task_output / "poster.jpg"

    write_video(group, indices, video_path, poster_path, label, crf)

    subtasks = [str(group["data/sub_task_instruction"][source_index]) for source_index in indices]
    frames = [
        {
            "index": frame_index,
            "sourceIndex": source_index,
            "time": round(frame_index / FPS, 4),
            "subtask": subtasks[frame_index],
        }
        for frame_index, source_index in enumerate(indices)
    ]

    return {
        "id": task_id,
        "label": label,
        "trajectoryLabel": f"Episode {episode_index}",
        "fps": FPS,
        "totalSteps": end - start,
        "frameCount": len(indices),
        "duration": round(len(indices) / FPS, 4),
        "video": public_path(video_path, public_root),
        "poster": public_path(poster_path, public_root),
        "frames": frames,
    }


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
    parser.add_argument("--episode-index", type=int, default=0, help="Episode index to extract from each task zarr.")
    parser.add_argument("--crf", type=int, default=24, help="H.264 quality setting; lower is higher quality/larger file.")
    parser.add_argument("--limit-frames", type=int, default=None, help="Debug only: export only the first N frames.")
    parser.add_argument(
        "--tasks",
        default=None,
        help="Optional comma-separated task ids to export from the source directory.",
    )
    args = parser.parse_args()

    source_root = Path(args.source).expanduser().resolve()
    output_root = Path(args.output).expanduser().resolve()
    public_root = Path("/data_all/intern10/egoscale/ftp1-policy/enpire-research.github.io/public").resolve()
    output_root.mkdir(parents=True, exist_ok=True)
    manifest_path = output_root / "manifest.json"
    previous_tasks_by_id = {}
    if manifest_path.exists():
        previous_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        previous_tasks_by_id = {task["id"]: task for task in previous_manifest.get("tasks", [])}

    selected_tasks = {task.strip() for task in args.tasks.split(",")} if args.tasks else None
    zarr_paths = sorted(source_root.glob("*.zarr"))
    if selected_tasks is not None:
        zarr_paths = [path for path in zarr_paths if path.stem in selected_tasks]
    if not zarr_paths:
        raise FileNotFoundError(f"No matching .zarr task directories found in {source_root}")

    tasks = []
    exported_task_ids = set()
    for zarr_path in zarr_paths:
        print(f"Exporting full 30fps trajectory for {zarr_path.name}...", flush=True)
        task = extract_task(zarr_path, output_root, public_root, args.episode_index, args.crf, args.limit_frames)
        exported_task_ids.add(task["id"])
        previous_task = previous_tasks_by_id.get(task["id"], {})
        for key in ("mainVideo", "mainPoster", "streams", "streamPosters"):
            if key in previous_task:
                task[key] = previous_task[key]
        tasks.append(task)

    for task_id, previous_task in previous_tasks_by_id.items():
        if task_id in exported_task_ids:
            continue
        if (output_root / task_id).exists():
            tasks.append(previous_task)
    task_order = {task_id: index for index, task_id in enumerate(TASK_LABELS)}
    tasks.sort(key=lambda task: task_order.get(task["id"], len(task_order)))

    manifest = {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "source": str(source_root),
        "episodeIndex": args.episode_index,
        "fps": FPS,
        "tasks": tasks,
    }
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote {manifest_path}", flush=True)


if __name__ == "__main__":
    main()
