import type { ThemeKey } from "../theme/theme.js";
import type { ResolvedV2Config } from "../config/V2Config.js";
import type {
  AnalysisPlan,
  BackendError,
  DoctorSummary,
  RecentTask,
  RunResult,
  SkillInfo,
  StepState,
  TaskRef,
  VideoMetadata,
} from "../types/contracts.js";

export type ShellStage = "input" | "plan" | "run" | "fallback" | "done";
export type ShellScreen = "home" | "chat" | "setup" | "protocol";

export interface ShellMessage {
  role: "user" | "assistant";
  text: string;
}

export interface ShellRenderState {
  theme: ThemeKey;
  stage: ShellStage;
  activeScreen: ShellScreen;
  selectedActionIndex: number;
  width: number;
  url: string;
  urlInputLine: string;
  chatInputLine: string;
  composerHint: string | null;
  config: ResolvedV2Config;
  chatHistory: ShellMessage[];
  taskRef: TaskRef | null;
  recentTasks: RecentTask[];
  selectedRecentIndex: number;
  runId: string | null;
  runOutputPath: string | null;
  runResult: RunResult | null;
  assetLoadError: string | null;
  skillName: string;
  skills: SkillInfo[];
  doctor: DoctorSummary | null;
  meta: VideoMetadata | null;
  plan: AnalysisPlan | null;
  progress: number;
  steps: Record<string, StepState>;
  err: BackendError | null;
  mascot: string;
}

export type Region = {
  width: number;
  height: number;
};

export type ShellLayout = {
  width: number;
  height: number;
  rail: Region;
  main: Region;
  side: Region;
  composer: Region;
  showSide: boolean;
};
