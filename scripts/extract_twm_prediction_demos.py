#!/usr/bin/env python3
"""Copy Tactile World Model prediction demos into the website public assets."""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path


SOURCE_ROOT = Path(
    "/data_all/intern10/egoscale/DiffSynth-Studio/outputs/"
    "wan22_rollout17_lora_test_episode_subtasks/"
    "step120000_test2eps_subtask_start_s8_episode_separate_native_resolution_wrist_aligned"
)
PUBLIC_ROOT = Path("/data_all/intern10/egoscale/ftp1-policy/enpire-research.github.io/public")
OUTPUT_ROOT = PUBLIC_ROOT / "touchworld" / "twm_demos"


TASK_LABELS = {
    "grasp_milktea_bottle": "Grasp Milktea Bottle",
    "grasp_water_bottle": "Grasp Water Bottle",
    "spray_water": "Spray Water",
    "stack_cups": "Stack Cups",
}


def public_path(path: Path) -> str:
    return "/" + path.relative_to(PUBLIC_ROOT).as_posix()


def copy_asset(source: Path, destination: Path) -> str:
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
    return public_path(destination)


def extract_first_frame(source_video: Path, destination: Path) -> str:
    destination.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(source_video),
            "-frames:v",
            "1",
            "-q:v",
            "3",
            str(destination),
        ],
        check=True,
    )
    return public_path(destination)


def main() -> None:
    if not SOURCE_ROOT.exists():
        raise FileNotFoundError(f"TWM source directory does not exist: {SOURCE_ROOT}")

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

    episodes = []
    for episode_json in sorted(SOURCE_ROOT.glob("*/episode.json")):
        episode_dir = episode_json.parent
        episode = json.loads(episode_json.read_text(encoding="utf-8"))
        task_id = str(episode["task"])
        episode_index = int(episode["episode_index"])
        episode_id = f"{task_id}_ep{episode_index:03d}"
        output_episode_dir = OUTPUT_ROOT / episode_id

        subtasks = []
        for subtask in episode["subtasks"]:
            segment_index = int(subtask["segment_index"])
            subtask_id = f"subtask_{segment_index:02d}"
            source_subtask_dir = SOURCE_ROOT / subtask["input_start"].split("/subtasks/")[0] / "subtasks" / subtask_id
            output_subtask_dir = output_episode_dir / subtask_id

            subtasks.append(
                {
                    "id": subtask_id,
                    "index": segment_index,
                    "instruction": subtask["subtask_instruction"],
                    "frameCount": 17,
                    "inputStart": copy_asset(
                        source_subtask_dir / "input_start_640x352.png",
                        output_subtask_dir / "input_start.png",
                    ),
                    "groundTruth": copy_asset(
                        source_subtask_dir / "ground_truth_17f_640x352.mp4",
                        output_subtask_dir / "ground_truth.mp4",
                    ),
                    "predicted": copy_asset(
                        source_subtask_dir / "predicted_17f_640x352.mp4",
                        output_subtask_dir / "predicted.mp4",
                    ),
                    "groundTruthPoster": extract_first_frame(
                        source_subtask_dir / "ground_truth_17f_640x352.mp4",
                        output_subtask_dir / "ground_truth_poster.jpg",
                    ),
                    "predictedPoster": extract_first_frame(
                        source_subtask_dir / "predicted_17f_640x352.mp4",
                        output_subtask_dir / "predicted_poster.jpg",
                    ),
                }
            )

        episodes.append(
            {
                "id": episode_id,
                "taskId": task_id,
                "label": TASK_LABELS.get(task_id, task_id.replace("_", " ").title()),
                "episodeLabel": f"Episode {episode_index:03d}",
                "globalInstruction": episode["subtasks"][0]["global_instruction"] if episode["subtasks"] else "",
                "fps": 15,
                "subtasks": subtasks,
            }
        )

    manifest = {
        "source": str(SOURCE_ROOT),
        "fps": 15,
        "episodes": episodes,
    }
    (OUTPUT_ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Copied {len(episodes)} TWM episodes to {OUTPUT_ROOT}")


if __name__ == "__main__":
    main()
