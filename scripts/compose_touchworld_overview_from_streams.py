#!/usr/bin/env python3
"""Compose TouchWorld overview videos from exported per-stream videos."""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path


PUBLIC_ROOT = Path("/data_all/intern10/egoscale/ftp1-policy/enpire-research.github.io/public")
DEMO_ROOT = PUBLIC_ROOT / "touchworld" / "demos"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"


def escape_drawtext(text: str) -> str:
    return text.replace("\\", "\\\\").replace("'", "\\'")


def draw_label(label: str, x: int, y: int, width: int) -> str:
    text_x = x + 8
    text_y = y + 5
    label = escape_drawtext(label)
    return (
        f"drawbox=x={x}:y={y}:w={width}:h=28:color=black@0.88:t=fill,"
        f"drawtext=fontfile={FONT}:text='{label}':x={text_x}:y={text_y}:fontsize=19:fontcolor=0xc4c4bc"
    )


def compose_task(task: dict[str, object]) -> None:
    task_id = str(task["id"])
    label = str(task["label"])
    duration = float(task["duration"])
    frame_count = int(task["frameCount"])
    task_dir = DEMO_ROOT / task_id
    output = task_dir / "overview.mp4"
    poster = task_dir / "overview.jpg"

    inputs = [
        task_dir / "main.mp4",
        task_dir / "leftWrist.mp4",
        task_dir / "rightWrist.mp4",
        task_dir / "tactile.mp4",
        task_dir / "subgoal.mp4",
    ]
    missing = [path for path in inputs if not path.exists()]
    if missing:
        print(f"Skipping {task_id}; missing {', '.join(str(path) for path in missing)}", flush=True)
        return

    label_box_width = max(248, min(520, len(label) * 15 + 30))
    label_text = escape_drawtext(label)
    filter_complex = (
        "[1:v]scale=730:411[main];"
        "[2:v]scale=230:129[left];"
        "[3:v]scale=230:129[right];"
        "[4:v]scale=230:126,pad=230:129:0:1:color=0x060712[tactile];"
        "[5:v]scale=408:224[subgoal];"
        "[0:v]"
        "drawbox=x=786:y=78:w=466:h=573:color=0x2579ff@1:t=3,"
        "drawbox=x=786:y=78:w=6:h=573:color=0x2579ff@1:t=fill,"
        "drawbox=x=806:y=238:w=426:h=370:color=0x2579ff@1:t=3,"
        "drawbox=x=28:y=23:w="
        f"{label_box_width}:h=39:color=black@0.88:t=fill,"
        f"drawtext=fontfile={FONT}:text='{label_text}':x=38:y=34:fontsize=23:fontcolor=0xf6f6ef,"
        f"drawtext=fontfile={FONT}:text='SUBGOAL GRID':x=814:y=123:fontsize=42:fontcolor=0xf6f6ef,"
        f"drawtext=fontfile={FONT}:text='Goal state paired with the current subtask':x=814:y=178:fontsize=17:fontcolor=0xb8b8b1,"
        f"{draw_label('OBSERVATION STREAMS', 28, 668, 236)}[base];"
        "[base][main]overlay=27:78[a];"
        "[a][left]overlay=27:522[b];"
        "[b][right]overlay=276:522[c];"
        "[c][tactile]overlay=524:522[d];"
        "[d][subgoal]overlay=814:310[e];"
        f"[e]drawtext=fontfile={FONT}:text='Current observation':x=44:y=99:fontsize=21:fontcolor=0xf0f0e8,"
        f"{draw_label('MAIN CAMERA', 44, 449, 145)},"
        f"{draw_label('LEFT WRIST', 38, 615, 122)},"
        f"{draw_label('RIGHT WRIST', 286, 615, 136)},"
        f"{draw_label('TACTILE OBS.', 534, 615, 132)},"
        f"{draw_label('SUBGOAL GRID', 826, 562, 144)}[v]"
    )

    command = [
        "ffmpeg",
        "-y",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        f"color=c=0x0c0c0c:s=1280x720:r=30:d={duration}",
    ]
    for path in inputs:
        command.extend(["-i", str(path)])
    command.extend(
        [
            "-filter_complex",
            filter_complex,
            "-map",
            "[v]",
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
            "24",
            "-movflags",
            "+faststart",
            "-frames:v",
            str(frame_count),
            str(output),
        ]
    )

    print(f"Composing overview for {task_id}...", flush=True)
    subprocess.run(command, check=True)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(output), "-frames:v", "1", "-q:v", "3", str(poster)],
        check=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--tasks",
        default=None,
        help="Optional comma-separated task ids to compose.",
    )
    args = parser.parse_args()
    selected_tasks = {task.strip() for task in args.tasks.split(",")} if args.tasks else None

    manifest_path = DEMO_ROOT / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for task in manifest["tasks"]:
        if selected_tasks is not None and task["id"] not in selected_tasks:
            continue
        compose_task(task)
        task_id = task["id"]
        task["video"] = f"/touchworld/demos/{task_id}/overview.mp4"
        task["poster"] = f"/touchworld/demos/{task_id}/overview.jpg"
        task.setdefault("streams", {})["overview"] = task["video"]
        task.setdefault("streamPosters", {})["overview"] = task["poster"]
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
