"use client";

import { FileText, List, Pause, Play, X } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import { ResetVideoCasePanel } from "@/components/ResetVideoCasePanel";

type ArticleBlock =
  | { type: "heading"; text: string }
  | { type: "subsection"; text: string }
  | { type: "subhead"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "image"; src: string; caption?: string; height?: number; transparent?: boolean; wide?: boolean; width?: number }
  | { type: "video"; src: string; caption?: string; paired?: string }
  | { type: "pusht-reset-case" }
  | { type: "pin-reset-case" }
  | { type: "ziptie-reset-case" }
  | { type: "gpu-reset-case" }
  | { type: "claim-grid" }
  | { type: "learned-policy-panels" }
  | { type: "system-intro" }
  | { type: "trajectory-demo" };

function isFigureBlock(block: ArticleBlock) {
  if (block.type === "image" || block.type === "video") {
    return Boolean(block.caption);
  }

  return (
    block.type === "trajectory-demo"
  );
}

const outlineItems = [
  { href: "#article-title", label: "Title" },
  { href: "#abstract", label: "Abstract" },
  { href: "#predictive-reactive-policy", label: "Policy Overview" },
  { href: "#touchworld-system", label: "TouchWorld System" },
  { href: "#hardware-interface", label: "Hardware Interface" },
  { href: "#tactile-world-model", label: "Tactile World Model", level: 2 },
  { href: "#tactile-refinement", label: "Tactile Refinement", level: 2 },
  { href: "#case-grasp-water-bottle", label: "Case 1: Grasp Water Bottle", level: 3 },
  { href: "#case-grasp-milktea-bottle", label: "Case 2: Grasp Milktea Bottle", level: 3 },
  { href: "#case-spray-water", label: "Case 3: Spray Water", level: 3 },
  { href: "#case-stack-cups", label: "Case 4: Stack Cups", level: 3 },
  { href: "#experiments", label: "Experiments" },
  { href: "#trajectory-samples", label: "Trajectory Samples", level: 2 },
  { href: "#planner-analysis", label: "Planner Analysis" },
  { href: "#benchmark-results", label: "Benchmark Results" },
  { href: "#qualitative-analysis", label: "Qualitative Analysis" },
  { href: "#limitations", label: "Limitations & Future Directions" },
  { href: "#acknowledgements", label: "Acknowledgements" },
];

const headingIds: Record<string, string> = {
  Abstract: "abstract",
  "Predictive and Reactive Tactile Policy": "predictive-reactive-policy",
  "TouchWorld System": "touchworld-system",
  "Robot Hardware and Tactile Interface": "hardware-interface",
  "Experiments": "experiments",
  "Vision-Language Subtask Planner Analysis": "planner-analysis",
  "Benchmark Results": "benchmark-results",
  "Qualitative Inference Analysis": "qualitative-analysis",
  "Limitations & Future Directions": "limitations",
  Acknowledgements: "acknowledgements",
};

const subsectionIds: Record<string, string> = {
  "Tactile World Model Prediction": "tactile-world-model",
  "Tactile-Conditioned Refinement": "tactile-refinement",
};

const subheadIds: Record<string, string> = {
  "Case 1: Grasp Water Bottle": "case-grasp-water-bottle",
  "Case 2: Grasp Milktea Bottle": "case-grasp-milktea-bottle",
  "Case 3: Spray Water": "case-spray-water",
  "Case 4: Stack Cups": "case-stack-cups",
};

const siteBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/touchworld-project";

function assetPath(path: string) {
  if (!path || path.startsWith("http") || path.startsWith("data:") || path.startsWith("#")) {
    return path;
  }

  return `${siteBasePath}${path.startsWith("/") ? path : `/${path}`}`;
}

const titleAuthors = [
  { name: "Jianyi Zhou", marks: "1,2*", href: "https://jianyi2004.github.io/" },
  { name: "Feiyang Hong", marks: "1,2*" },
  { name: "Yunhao Li", marks: "1,2*" },
  { name: "Yicheng Zhao", marks: "1,2" },
  { name: "Yongjue Cen", marks: "1,2" },
  { name: "Zirui Liu", marks: "1,2" },
  { name: "Jiakang Huang", marks: "1,2" },
  { name: "Zirui Chen", marks: "1,2" },
  { name: "Ruiyang Zhang", marks: "1,2", breakBefore: true },
  { name: "Weizhuo Zhu", marks: "1,2" },
  { name: "Xuhua Song", marks: "1,2" },
  { name: "Shuo Yang", marks: "1,2†", href: "https://homepage.hit.edu.cn/yangshuohit" },
];

const titleAffiliations = [
  { mark: "1", label: "Harbin Institute of Technology, Shenzhen" },
  { mark: "2", label: "PHANES AI" },
  { mark: "*", label: "Equal contribution" },
  { mark: "†", label: "Corresponding author" },
];

const titleLogos = [
  { alt: "Harbin Institute of Technology, Shenzhen", src: assetPath("/touchworld/logos/hitsz.png"), width: 295, height: 55 },
  { alt: "PHANES AI", src: assetPath("/touchworld/logos/sologo-aitools-bgremover-trimmed.png"), width: 938, height: 192 },
];

const article: ArticleBlock[] = [
  { type: "heading", text: "Abstract" },
  {
    type: "paragraph",
    text: "Dexterous manipulation in everyday environments requires both anticipation and reaction: a robot must predict how contact should evolve while rapidly correcting local errors caused by slip, misalignment, unstable grasping, or force mismatch. Vision and language provide semantic and geometric guidance, but they cannot reliably reveal hidden contact states such as force, slip, and contact stability.",
  },
  {
    type: "paragraph",
    text: "We introduce TouchWorld, a predictive-and-reactive tactile foundation model for dexterous manipulation. TouchWorld uses a hierarchical policy that separates vision-language subtask planning, tactile world-model prediction, visuo-tactile goal-conditioned action generation, and high-frequency tactile residual refinement.",
  },
  {
    type: "paragraph",
    text: "A High-Level Planning Layer produces executable subtasks and predicts tactile subgoals; a Visuo-Tactile Goal-Conditioned Policy generates nominal action chunks; and a Tactile-Conditioned Refinement Policy performs online residual correction using recent tactile and proprioceptive feedback.",
  },
  {
    type: "paragraph",
    text: "Across six long-horizon and contact-rich dexterous manipulation tasks, TouchWorld achieves 65.0% success in the clean setting and 53.7% success under human perturbations, outperforming the strongest baseline by 15.7 and 18.5 percentage points, respectively.",
  },
  { type: "heading", text: "Predictive and Reactive Tactile Policy" },
  { type: "learned-policy-panels" },
  {
    type: "paragraph",
    text: "TouchWorld uses touch in two complementary ways: a predictive pathway anticipates future contact-aware goals, and a reactive pathway corrects local execution errors online. This keeps semantic reasoning, predictive goal generation, nominal action generation, and tactile feedback correction on separate time scales.",
  },
  {
    type: "image",
    src: assetPath("/touchworld/figures/teasor.png"),
    caption: "Conceptual overview of TouchWorld. The high-level planning layer predicts executable subtasks and visual-tactile subgoals, while the downstream policies generate nominal actions and high-frequency tactile refinements.",
    height: 1123,
    wide: true,
    width: 2783,
  },
  { type: "heading", text: "TouchWorld System" },
  { type: "system-intro" },
  {
    type: "image",
    src: assetPath("/touchworld/figures/3-layer.png"),
    caption: "TouchWorld architecture. The subtask planner, tactile world model, goal-conditioned policy, and tactile refinement policy operate at separate semantic, action, and control-loop time scales.",
    height: 1268,
    wide: true,
    width: 2355,
  },
  {
    type: "heading",
    text: "Robot Hardware and Tactile Interface",
  },
  {
    type: "paragraph",
    text: "TouchWorld is evaluated on a humanoid platform equipped with Wuji dexterous hands and a JQ-Industries tactile glove. The teleoperation side uses a Meta Quest headset, Meta Quest Touch Plus controllers, and a Wuji Glove to collect synchronized visual, proprioceptive, action, and tactile demonstrations.",
  },
  {
    type: "image",
    src: assetPath("/touchworld/figures/hardware.png"),
    caption: "Hardware platform for TouchWorld. The human teleoperation stack collects visual and hand-motion inputs, while the robot platform executes dexterous manipulation with tactile feedback.",
    height: 1253,
    wide: true,
    width: 2860,
  },
  { type: "subsection", text: "Tactile World Model Prediction" },
  {
    type: "paragraph",
    text: "The Tactile World Model predicts future visual-tactile subgoals that describe the expected contact outcome of the current subtask. These predictions serve as contact-aware references for downstream action generation.",
  },
  { type: "subsection", text: "Tactile-Conditioned Refinement" },
  {
    type: "paragraph",
    text: "The Tactile-Conditioned Refinement Policy operates faster than the nominal VLA policy. At each refinement step, it reads a sliding nominal-action lookahead window, recent tactile histories, and proprioception, then predicts a residual action correction.",
  },
  { type: "subhead", text: "Case 1: Grasp Water Bottle" },
  { type: "pusht-reset-case" },
  { type: "subhead", text: "Case 2: Grasp Milktea Bottle" },
  { type: "pin-reset-case" },
  { type: "subhead", text: "Case 3: Spray Water" },
  { type: "ziptie-reset-case" },
  { type: "subhead", text: "Case 4: Stack Cups" },
  { type: "gpu-reset-case" },
  {
    type: "list",
    items: [
      "The predictive pathway supplies contact-aware subgoals for stable long-horizon execution.",
      "The reactive pathway corrects local contact errors caused by slip, perturbation, or misalignment.",
    ],
  },
  { type: "heading", text: "Experiments" },
  {
    type: "paragraph",
    text: "We evaluate TouchWorld on six real-robot tasks: Water Flower, Tabletop Clearing, Cup Insertion, Power Plug Insertion, Pot Wiping, and Tissue Pulling. Each task is evaluated in both a clean setting and a human perturbation setting.",
  },
  {
    type: "image",
    src: assetPath("/touchworld/figures/task_setting.png"),
    caption: "Real-robot task suite for evaluating TouchWorld. The tasks cover long-horizon planning, precision insertion, continuous contact regulation, soft-object handling, and recovery from human perturbations.",
    height: 1600,
    wide: true,
    width: 2300,
  },
  { type: "trajectory-demo" },
  { type: "heading", text: "Vision-Language Subtask Planner Analysis" },
  {
    type: "paragraph",
    text: "The Subtask Planner receives the task instruction, current visual observations, and high-level memory, then emits an executable subtask for downstream policy conditioning. The memory-augmented planner improves subtask accuracy, execution success, and transition consistency.",
  },
  { type: "heading", text: "Benchmark Results" },
  {
    type: "paragraph",
    text: "TouchWorld consistently improves over Pi-0.5, FTP-1, and GR00T N1.7 across both clean and human-perturbed rollouts. The gains are especially clear on Power Plug Insertion, Pot Wiping, and Tissue Pulling, where tactile prediction and fast local correction are most important.",
  },
  {
    type: "image",
    src: assetPath("/touchworld/figures/ablation_results_stacked.png"),
    caption: "Stacked ablation results. Each bar reports average success with task-level contributions, comparing clean rollouts against human-perturbed rollouts.",
    height: 1103,
    wide: true,
    width: 2485,
  },
  { type: "heading", text: "Qualitative Inference Analysis" },
  {
    type: "paragraph",
    text: "TouchWorld decomposes each instruction into executable intermediate subtasks and predicts tactile subgoals that provide contact-aware references for downstream action generation.",
  },
  {
    type: "image",
    src: assetPath("/touchworld/figures/infer_demo.png"),
    caption: "Qualitative inference demonstration of TouchWorld. For each task, the model progresses from the initial scene through executable subtasks and predicts tactile subgoals for contact-aware manipulation.",
    height: 1578,
    wide: true,
    width: 2308,
  },
  { type: "heading", text: "Limitations & Future Directions" },
  { type: "subhead", text: "Task diversity" },
  {
    type: "paragraph",
    text: "Our real-robot evaluation focuses on six representative contact-rich tasks. These tasks cover planning, insertion, wiping, and soft-object handling, but they do not yet exhaust the diversity of household manipulation or deformable-object interactions.",
  },
  { type: "subhead", text: "Sensor and embodiment transfer" },
  {
    type: "paragraph",
    text: "TouchWorld is tied to the sensing layout used in our robot platform. Transferring to a different tactile sensor or hand morphology still requires calibration, normalization, and likely a small amount of adaptation data.",
  },
  { type: "heading", text: "Acknowledgements" },
  {
    type: "paragraph",
    text: "We thank the Harbin Institute of Technology, Shenzhen and PHANES AI teams for their support with the robot platform, data collection, and experiments.",
  },
];

function MediaBlock({ block, figureNumber }: { block: Extract<ArticleBlock, { type: "video" | "image" }>; figureNumber?: number }) {
  const caption = block.caption && figureNumber ? `Figure ${figureNumber}: ${block.caption}` : block.caption;

  if (block.type === "image") {
    const className = [
      "media-frame",
      block.wide ? "media-frame--wide" : "",
      block.transparent ? "media-frame--transparent" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <figure className={className}>
        <Image
          alt=""
          height={block.height ?? 720}
          src={block.src}
          style={block.transparent ? { background: "transparent" } : undefined}
          width={block.width ?? 1280}
        />
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <figure className="media-frame">
      {block.paired ? (
        <div className="quad-media">
          <VideoPlayer autoPlay loop src={block.src} title={`${block.caption ?? "Comparison"} (left)`} />
          <VideoPlayer autoPlay loop src={block.paired} title={`${block.caption ?? "Comparison"} (right)`} />
        </div>
      ) : (
        <VideoPlayer src={block.src} title={block.caption ?? "Video"} />
      )}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function touchWorldCaseStates(taskId: string) {
  return [0, 1, 2, 3].map((episodeIndex) => ({
    id: `${taskId}-episode-${episodeIndex}`,
    label: `Trajectory ${episodeIndex + 1}`,
    poster: assetPath(`/touchworld/cases/${taskId}/episode_${String(episodeIndex).padStart(2, "0")}.jpg`),
    video: assetPath(`/touchworld/cases/${taskId}/episode_${String(episodeIndex).padStart(2, "0")}.mp4`),
  }));
}

function GraspWaterBottleCasePanel() {
  return (
    <ResetVideoCasePanel
      ariaLabel="Case 1 Grasp Water Bottle trajectories"
      initialStates={touchWorldCaseStates("grasp_water_bottle")}
    />
  );
}

function PinResetCasePanel() {
  return (
    <ResetVideoCasePanel
      ariaLabel="Case 2 Grasp Milktea Bottle trajectories"
      initialStates={touchWorldCaseStates("grasp_milktea_bottle")}
    />
  );
}

function ZiptieResetCasePanel() {
  return (
    <section className="gpu-reset-section">
      <aside className="gpu-reset-sidenote" aria-label="Contact-rich manipulation procedure">
        <strong>Contact-rich manipulation</strong>
        <ol>
          <li>Predict the expected tactile subgoal for the current manipulation phase.</li>
          <li>Use tactile feedback to correct local slip, force mismatch, and misalignment online.</li>
        </ol>
      </aside>
      <ResetVideoCasePanel
        ariaLabel="Case 3 Spray Water trajectories"
        initialStates={touchWorldCaseStates("spray_water")}
      />
    </section>
  );
}

function GpuResetCasePanel() {
  return (
    <section className="gpu-reset-section">
      <aside className="gpu-reset-sidenote" aria-label="Tactile refinement procedure">
        <strong>Tactile refinement</strong>
        <ol>
          <li>Start from a nominal action chunk generated by the visuo-tactile policy.</li>
          <li>Refresh residual corrections after new tactile and proprioceptive feedback arrives.</li>
        </ol>
      </aside>
      <ResetVideoCasePanel
        ariaLabel="Case 4 Stack Cups trajectories"
        initialStates={touchWorldCaseStates("stack_cups")}
      />
    </section>
  );
}

function ClaimGrid() {
  const claims = [
    {
      label: "Research loop",
      value: "End-to-end",
      text: "Agents can build environments, write policies, run trials, and revise code from real feedback.",
    },
    {
      label: "Environment",
      value: "Auto reset",
      text: "Each task exposes randomized starts, reset videos, and verification signals for repeatable experiments.",
    },
    {
      label: "Scaling",
      value: "1 to 8 agents",
      text: "Fleet experiments expose the tradeoff between wall-clock speed, token throughput, and hardware use.",
    },
  ];

  return (
    <section className="claim-section" aria-label="TouchWorld headline claims">
      <span className="claim-section__label">Thesis</span>
      <p>
        The claim is not that touch is simply another observation stream. The claim is that tactile signals should be
        used both predictively, as contact-aware goals, and reactively, as fast feedback for local correction.
      </p>
      <ol className="claim-list" aria-label="Key claims">
        {claims.map((claim) => (
          <li key={claim.label}>
            <strong>{claim.value}</strong>
            <span>{claim.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

type LearnedPolicy = {
  imageSrc?: string;
  title: string;
  videoSrc?: string;
};

function LearnedPolicyPanel({ policy }: { policy: LearnedPolicy }) {
  return (
    <article className="learned-policy-panel">
      <div
        className={`learned-policy-panel__surface${
          policy.videoSrc ? " learned-policy-panel__surface--video" : ""
        }`}
      >
        {policy.videoSrc ? (
          <VideoPlayer autoPlay loop src={policy.videoSrc} title={policy.title} />
        ) : null}
        {policy.imageSrc ? <Image alt="" fill sizes="(max-width: 900px) 50vw, 30vw" src={policy.imageSrc} /> : null}
      </div>
      <h3 className="learned-policy-panel__title">{policy.title}</h3>
    </article>
  );
}

function LearnedPolicyPanels() {
  const policies: LearnedPolicy[] = [
    { title: "Grasp Milktea Bottle", videoSrc: assetPath("/touchworld/demos/grasp_milktea_bottle/main_camera.mp4") },
    { title: "Grasp Water Bottle", videoSrc: assetPath("/touchworld/demos/grasp_water_bottle/main_camera.mp4") },
    { title: "Spray Water", videoSrc: assetPath("/touchworld/demos/spray_water/main_camera.mp4") },
    { title: "Stack Cups", videoSrc: assetPath("/touchworld/demos/stack_cups/main_camera.mp4") },
  ];

  return (
    <>
      <section className="sidenote-row">
        <p className="learned-policy-summary">
          TouchWorld improves average success across six contact-rich manipulation tasks in both clean and perturbed
          settings.
        </p>
        <aside className="article-sidenote" aria-label="Why tactile feedback matters">
          <strong>Why tactile feedback matters</strong>
          <p>
            Vision and language can describe the task and scene, but they often miss slip, force, contact stability,
            and insertion alignment. Touch exposes these hidden local states.
          </p>
          <p>
            TouchWorld separates slow semantic planning from high-frequency tactile residual correction, so contact
            changes can influence control without waiting for the next nominal action chunk.
          </p>
        </aside>
      </section>
      <section className="learned-policy-section">
        <div className="learned-policy-grid" aria-label="Learned manipulation policy tasks">
          {policies.map((policy) => (
            <LearnedPolicyPanel key={policy.title} policy={policy} />
          ))}
        </div>
      </section>
    </>
  );
}

function ModuleGrid() {
  const modules = [
    {
      tag: "SP",
      title: "Subtask Planner",
      text: "Decompose long-horizon task instructions into executable subtasks for the downstream policy.",
    },
    {
      tag: "TWM",
      title: "Tactile World Model",
      text: "Predict visual-tactile subgoals that describe expected future contact outcomes.",
    },
    {
      tag: "VLA",
      title: "Goal-Conditioned Policy",
      text: "Generate nominal action chunks from vision, language, proprioception, tactile images, and predicted goals.",
    },
    {
      tag: "TRT",
      title: "Tactile Refinement",
      text: "Refresh residual corrections online using recent tactile and proprioceptive feedback.",
    },
  ];

  return (
    <aside className="article-sidenote" aria-label="TouchWorld decomposition">
      <ol>
        {modules.map((module) => (
          <li key={module.tag}>
            <span>{module.tag}</span>
            <div>
              <strong>{module.title}</strong>
              <p>{module.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function SystemIntro() {
  return (
    <section className="sidenote-row">
      <ModuleGrid />
    </section>
  );
}

type TouchWorldDemoFrame = {
  index: number;
  sourceIndex: number;
  time: number;
  subtask: string;
};

type TouchWorldDemoStreamId = "overview" | "main" | "leftWrist" | "rightWrist" | "tactile" | "subgoal";

type TouchWorldDemoTask = {
  id: string;
  label: string;
  trajectoryLabel: string;
  fps: number;
  totalSteps: number;
  frameCount: number;
  duration: number;
  video: string;
  poster: string;
  mainVideo?: string;
  mainPoster?: string;
  streams?: Record<TouchWorldDemoStreamId, string>;
  streamPosters?: Record<TouchWorldDemoStreamId, string>;
  frames: TouchWorldDemoFrame[];
};

type TouchWorldDemoManifest = {
  generatedAt: string;
  source: string;
  tasks: TouchWorldDemoTask[];
};

function TouchWorldTrajectoryExplorer({ figureNumber }: { figureNumber: number }) {
  const [manifest, setManifest] = useState<TouchWorldDemoManifest | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string>("");
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [activeStreamId, setActiveStreamId] = useState<TouchWorldDemoStreamId>("overview");
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(assetPath("/touchworld/demos/manifest.json"))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Demo manifest request failed with ${response.status}`);
        }
        return response.json() as Promise<TouchWorldDemoManifest>;
      })
      .then((nextManifest) => {
        if (cancelled) {
          return;
        }
        setManifest(nextManifest);
        setActiveTaskId(nextManifest.tasks[0]?.id ?? "");
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeTask = manifest?.tasks.find((task) => task.id === activeTaskId) ?? manifest?.tasks[0];
  const currentFrame = activeTask?.frames[frameIndex] ?? activeTask?.frames[0];
  const streamPanels: Array<{ id: TouchWorldDemoStreamId; label: string; primary?: boolean }> = [
    { id: "overview", label: "Overview", primary: true },
    { id: "main", label: "Main camera" },
    { id: "leftWrist", label: "Left wrist" },
    { id: "rightWrist", label: "Right wrist" },
    { id: "tactile", label: "Tactile" },
    { id: "subgoal", label: "Subgoal grid" },
  ];
  const orderedStreamPanels = [
    ...streamPanels.filter((panel) => panel.id === activeStreamId),
    ...streamPanels.filter((panel) => panel.id !== activeStreamId),
  ];

  const getStreamSrc = (streamId: TouchWorldDemoStreamId) =>
    assetPath(
      (streamId === "overview" ? activeTask?.video : undefined) ??
        activeTask?.streams?.[streamId] ??
        (streamId === "main" ? activeTask?.mainVideo : undefined) ??
        "",
    );

  const getStreamPoster = (streamId: TouchWorldDemoStreamId) =>
    assetPath(
      (streamId === "overview" ? activeTask?.poster : undefined) ??
        activeTask?.streamPosters?.[streamId] ??
        (streamId === "main" ? activeTask?.mainPoster : undefined) ??
        "",
    );

  const selectTask = (taskId: string) => {
    if (taskId !== activeTaskId) {
      setFrameIndex(0);
      setProgress(0);
      setIsPlaying(true);
      setActiveStreamId("overview");
      setActiveTaskId(taskId);
    }
  };

  const syncFromVideoTime = (video: HTMLVideoElement) => {
    if (!activeTask || activeTask.frameCount <= 0) {
      return;
    }
    const duration = video.duration || activeTask.duration || 0;
    const nextProgress = duration > 0 ? video.currentTime / duration : 0;
    const nextFrame = Math.min(
      activeTask.frameCount - 1,
      Math.max(0, Math.floor(video.currentTime * activeTask.fps)),
    );
    setProgress(nextProgress);
    setFrameIndex(nextFrame);
  };

  const scrubToProgress = (value: number) => {
    if (!activeTask) {
      return;
    }
    const clamped = Math.min(1, Math.max(0, value));
    const video = activeVideoRef.current;
    const duration = video?.duration || activeTask.duration;
    const nextTime = clamped * duration;
    if (video) {
      video.currentTime = Math.min(nextTime, video.duration || nextTime);
    }
    setProgress(clamped);
    setFrameIndex(Math.min(activeTask.frameCount - 1, Math.round(clamped * (activeTask.frameCount - 1))));
  };

  const togglePlayback = async () => {
    const video = activeVideoRef.current;

    if (!video || video.paused) {
      await video?.play().catch(() => undefined);
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  if (loadError) {
    return (
      <figure className="touchworld-demo" id="trajectory-samples">
        <div className="touchworld-demo__empty">
          <strong>Trajectory samples are not extracted yet.</strong>
          <span>Run bash extract_touchworld_demos.sh, then rebuild or refresh the static preview.</span>
        </div>
        <figcaption>Figure {figureNumber}: TouchWorld trajectory sample explorer.</figcaption>
      </figure>
    );
  }

  if (!activeTask || !currentFrame) {
    return (
      <figure className="touchworld-demo" id="trajectory-samples">
        <div className="touchworld-demo__empty">
          <strong>Loading trajectory samples...</strong>
        </div>
        <figcaption>Figure {figureNumber}: TouchWorld trajectory sample explorer.</figcaption>
      </figure>
    );
  }

  return (
    <figure className="touchworld-demo" id="trajectory-samples">
      <div className="touchworld-demo__head">
        <div>
          <span className="touchworld-demo__eyebrow">Dataset sample</span>
          <h3>Synchronized observations at 30 frames per second</h3>
        </div>
        <div className="touchworld-demo__status">
          <span>{activeTask.trajectoryLabel} · {activeTask.fps}fps</span>
          <strong>{frameIndex + 1}/{activeTask.frameCount}</strong>
        </div>
      </div>

      <div className="touchworld-demo__tabs" role="tablist" aria-label="TouchWorld dataset tasks">
        {manifest?.tasks.map((task) => (
          <button
            aria-selected={task.id === activeTask.id}
            data-active={task.id === activeTask.id}
            key={task.id}
            onClick={() => selectTask(task.id)}
            role="tab"
            type="button"
          >
            {task.label}
          </button>
        ))}
      </div>

      <div className="touchworld-demo__stage">
        <section className="touchworld-demo__streams" aria-label={`${activeTask.label} synchronized observation streams`}>
          {orderedStreamPanels.map((panel, panelIndex) => (
            <button
              aria-pressed={panel.id === activeStreamId}
              className={`touchworld-demo__video-panel${
                panelIndex === 0 ? " touchworld-demo__video-panel--primary" : ""
              }`}
              data-active={panel.id === activeStreamId}
              key={`${activeTask.id}-${panel.id}`}
              onClick={() => {
                setActiveStreamId(panel.id);
              }}
              type="button"
            >
              {panelIndex === 0 ? (
                <video
                  aria-label={`${activeTask.label} ${panel.label}`}
                  autoPlay
                  loop
                  muted
                  onLoadedMetadata={(event) => {
                    event.currentTarget.currentTime = progress * (event.currentTarget.duration || activeTask.duration);
                    if (isPlaying) {
                      event.currentTarget.play().catch(() => undefined);
                    }
                  }}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onTimeUpdate={(event) => syncFromVideoTime(event.currentTarget)}
                  playsInline
                  poster={getStreamPoster(panel.id)}
                  preload="auto"
                  ref={activeVideoRef}
                  src={getStreamSrc(panel.id)}
                />
              ) : (
                <Image
                  alt={`${activeTask.label} ${panel.label} preview`}
                  fill
                  sizes="(max-width: 900px) 45vw, 130px"
                  src={getStreamPoster(panel.id)}
                  unoptimized
                />
              )}
              <span>{panel.label}</span>
            </button>
          ))}
        </section>
        <aside className="touchworld-demo__goals" aria-label="Subtask and trajectory readout">
          <div className="touchworld-demo__subtask">
            <span>Current subtask</span>
            <p>{currentFrame.subtask}</p>
          </div>
          <dl className="touchworld-demo__readout">
            <div>
              <dt>Playback</dt>
              <dd>{isPlaying ? "Playing" : "Paused"}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{currentFrame.time.toFixed(2)}s</dd>
            </div>
            <div>
              <dt>Source frame</dt>
              <dd>{currentFrame.sourceIndex}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="touchworld-demo__controls" aria-label="Trajectory playback controls">
        <button
          aria-label={isPlaying ? "Pause trajectory video" : "Play trajectory video"}
          onClick={togglePlayback}
          type="button"
        >
          {isPlaying ? <Pause aria-hidden="true" size={15} /> : <Play aria-hidden="true" size={15} />}
          {isPlaying ? "Pause" : "Play"}
        </button>
        <span>{Math.round(progress * 100)}%</span>
        <label
          className="touchworld-demo__progress"
          style={{ "--touchworld-demo-progress": `${progress * 100}%` } as CSSProperties}
        >
          <span className="sr-only">Trajectory frame progress</span>
          <input
            max="1"
            min="0"
            onChange={(event) => scrubToProgress(Number(event.currentTarget.value))}
            onInput={(event) => scrubToProgress(Number(event.currentTarget.value))}
            step="0.001"
            type="range"
            value={progress}
          />
        </label>
        <span>{activeTask.duration.toFixed(1)}s full trajectory</span>
      </div>

      <figcaption>
        Figure {figureNumber}: Full 30fps trajectories from Wuji Stage2. The synchronized panels show RGB observations,
        tactile observation, and the current subgoal grid; the current executable subtask is synchronized to the video
        frame.
      </figcaption>
    </figure>
  );
}

function ArticleOutline({ activeHref }: { activeHref: string }) {
  return (
    <aside className="article-outline" aria-label="Article outline">
      <nav>
        {outlineItems.map((item) => (
          <a
            aria-current={activeHref === item.href ? "true" : undefined}
            data-level={item.level ?? 1}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

// Mobile-only nav: a floating "Contents" button opens a drawer with the full
// nested outline (the desktop sidebar / mobile strip is hidden on phones).
function MobileOutline({ activeHref }: { activeHref: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="mobile-outline">
      <button
        aria-expanded={open}
        aria-label="Open table of contents"
        className="mobile-outline__trigger"
        onClick={() => setOpen(true)}
        type="button"
      >
        <List aria-hidden="true" size={16} strokeWidth={1.9} />
        Contents
      </button>

      <div className="mobile-outline__overlay" data-open={open} role="presentation" onClick={() => setOpen(false)}>
        <nav
          aria-label="Table of contents"
          className="mobile-outline__panel"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mobile-outline__head">
            <span>Contents</span>
            <button aria-label="Close table of contents" onClick={() => setOpen(false)} type="button">
              <X aria-hidden="true" size={18} strokeWidth={1.8} />
            </button>
          </div>
          <div className="mobile-outline__links">
            {outlineItems.map((item) => (
              <a
                aria-current={activeHref === item.href ? "true" : undefined}
                data-level={item.level ?? 1}
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

function ArticleContent() {
  const [activeHref, setActiveHref] = useState(outlineItems[0].href);
  let figureNumber = 0;

  useEffect(() => {
    let frame = 0;

    const syncActiveSection = () => {
      frame = 0;
      const targetY = window.innerHeight * 0.28;
      let current = outlineItems[0].href;

      for (const item of outlineItems) {
        const section = document.getElementById(item.href.slice(1));
        if (!section) {
          continue;
        }

        if (section.getBoundingClientRect().top <= targetY) {
          current = item.href;
        }
      }

      setActiveHref((previous) => (previous === current ? previous : current));
    };

    const requestSync = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(syncActiveSection);
    };

    requestSync();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
    };
  }, []);

  return (
    <section className="article-body" data-outline-open="true" id="article-content">
      <div className="article-layout">
        <ArticleOutline activeHref={activeHref} />
        <MobileOutline activeHref={activeHref} />
        <article className="article-shell">
	        <header className="article-title-block" id="article-title">
	          <h1>
	            TouchWorld: A Predictive and Reactive Tactile Foundation Model for Dexterous Manipulation
	          </h1>
            <div className="article-authors" aria-label="Authors and affiliations">
              <p className="article-authors__names">
                {titleAuthors.map((author, index) => (
                  <span key={author.name}>
                    {"breakBefore" in author ? <br className="article-author-break" /> : null}
                    <span className="article-author">
                      {"href" in author && author.href ? (
                        <a className="article-author-link" href={author.href} rel="noopener noreferrer" target="_blank">
                          {author.name}
                        </a>
                      ) : (
                        author.name
                      )}
                      <sup>{author.marks}</sup>
                    </span>
                    {index < titleAuthors.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
              <p className="article-authors__affiliations">
                {titleAffiliations.map((affiliation) => (
                  <span key={affiliation.mark}>
                    <sup>{affiliation.mark}</sup>
                    {affiliation.label}
                  </span>
                ))}
              </p>
              <div className="article-links" aria-label="Resources">
                <a
                  className="article-link"
                  href={assetPath("/touchworld/paper.pdf")}
                >
                  <FileText aria-hidden="true" size={16} strokeWidth={1.8} />
                  Paper
                </a>
              </div>
              <div className="article-logo-row" aria-label="Institution logos">
                {titleLogos.map((logo) => (
                  <Image
                    alt={logo.alt}
                    className="article-logo-row__image"
                    height={logo.height}
                    key={logo.alt}
                    src={logo.src}
                    unoptimized
                    width={logo.width}
                  />
                ))}
              </div>
            </div>
	        </header>
        {article.map((block, index) => {
          const currentFigureNumber = isFigureBlock(block) ? ++figureNumber : undefined;

          if (block.type === "heading") {
            return (
              <h2 id={headingIds[block.text]} key={index}>
                {block.text}
              </h2>
            );
          }

          if (block.type === "subsection") {
            return (
              <h3 className="article-subsection" id={subsectionIds[block.text]} key={index}>
                {block.text}
              </h3>
            );
          }

          if (block.type === "subhead") {
            return (
              <div
                className="article-kicker"
                id={subheadIds[block.text]}
                key={index}
              >
                <strong>{block.text}</strong>
              </div>
            );
          }

          if (block.type === "paragraph") {
            return <p key={index}>{block.text}</p>;
          }

          if (block.type === "list") {
            return (
              <ul key={index}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          }

          if (block.type === "claim-grid") {
            return <ClaimGrid key={index} />;
          }

          if (block.type === "learned-policy-panels") {
            return <LearnedPolicyPanels key={index} />;
          }

          if (block.type === "system-intro") {
            return <SystemIntro key={index} />;
          }

          if (block.type === "pusht-reset-case") {
            return <GraspWaterBottleCasePanel key={index} />;
          }

          if (block.type === "pin-reset-case") {
            return <PinResetCasePanel key={index} />;
          }

          if (block.type === "ziptie-reset-case") {
            return <ZiptieResetCasePanel key={index} />;
          }

          if (block.type === "gpu-reset-case") {
            return <GpuResetCasePanel key={index} />;
          }

          if (block.type === "trajectory-demo") {
            return <TouchWorldTrajectoryExplorer figureNumber={currentFigureNumber ?? 0} key={index} />;
          }

          return <MediaBlock block={block} figureNumber={currentFigureNumber} key={index} />;
        })}
        </article>
      </div>
    </section>
  );
}

function HeroTeaser() {
  return (
    <section className="article-hero">
      <div className="article-hero__sticky">
        <Image
          alt="TouchWorld real-robot tactile manipulation tasks"
          className="article-hero__video"
          height={966}
          priority
          sizes="100vw"
          src={assetPath("/touchworld/figures/background.png")}
          width={1988}
        />
        <div className="article-hero__title" data-revealed="true">
          <span className="article-hero__wordmark" aria-label="TouchWorld">
            {"TouchWorld".split("").map((ch, i) => (
              <span
                key={i}
                aria-hidden="true"
                // The "I" (index 3) is thrown in like a spear — rotates from a
                // diagonal and lands vertical — mirroring the teaser's title reveal.
                className={`article-hero__letter${i === 3 ? " article-hero__letter--spear" : ""}`}
                style={{ animationDelay: `${i * 0.18}s` }}
              >
                {ch}
              </span>
            ))}
          </span>
        </div>
        <a className="scroll-cue" href="#article-content">
          Scroll to explore
        </a>
      </div>
    </section>
  );
}

export default function Home() {
  // Dark mode is disabled site-wide: the page always renders in day theme and
  // there is no theme toggle.
  return (
    <main className="figure-page" data-theme="day">
      <HeroTeaser />

      <ArticleContent />
    </main>
  );
}
