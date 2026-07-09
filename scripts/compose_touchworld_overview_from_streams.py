#!/usr/bin/env python3
"""Compose TouchWorld overview videos from exported per-stream videos."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path


PUBLIC_ROOT = Path("/data_all/intern10/egoscale/ftp1-policy/enpire-research.github.io/public")
DEMO_ROOT = PUBLIC_ROOT / "touchworld" / "demos"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"


def draw_label(label: str, x: int, y: int, width: int) -> str:
    text_x = x + 8
    text_y = y + 5
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

    filter_complex = (
        "[1:v]scale=730:411[main];"
        "[2:v]scale=230:129[left];"
        "[3:v]scale=230:129[right];"
        "[4:v]scale=234:117[tactile];"
        "[5:v]scale=496:273[subgoal];"
        "[0:v][main]overlay=24:58[a];"
        "[a][left]overlay=24:493[b];"
        "[b][right]overlay=272:493[c];"
        "[c][tactile]overlay=520:493[d];"
        "[d][subgoal]overlay=760:224[e];"
        f"[e]drawtext=fontfile={FONT}:text='{label}':x=24:y=18:fontsize=24:fontcolor=0xf6f6ef,"
        f"{draw_label('MAIN CAMERA', 34, 433, 132)},"
        f"{draw_label('LEFT WRIST', 34, 592, 120)},"
        f"{draw_label('RIGHT WRIST', 282, 592, 135)},"
        f"{draw_label('TACTILE', 530, 579, 92)},"
        f"{draw_label('SUBGOAL GRID', 770, 469, 145)}[v]"
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
    manifest_path = DEMO_ROOT / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for task in manifest["tasks"]:
        compose_task(task)
        task_id = task["id"]
        task["video"] = f"/touchworld/demos/{task_id}/overview.mp4"
        task["poster"] = f"/touchworld/demos/{task_id}/overview.jpg"
        task.setdefault("streams", {})["overview"] = task["video"]
        task.setdefault("streamPosters", {})["overview"] = task["poster"]
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
