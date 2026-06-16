import {
  TUI,
  type Component,
  matchesKey,
  ProcessTerminal,
  Input,
} from "@earendil-works/pi-tui";
import { resolveV2Config, type ResolvedV2Config } from "../config/V2Config.js";
import { THEME_KEYS, type ThemeKey } from "../theme/theme.js";
import type { AnalyzeRequest, Transport } from "../sdk/client.js";
import { DEFAULT_SKILLS } from "../mock/data.js";
import type { AnalysisPlan, BackendError, Depth, DoctorSummary, RecentTask, RunResult, SkillInfo, StepState, TaskRef, VideoMetadata } from "../types/contracts.js";
import { actionSet, type ActionId } from "./ActionModel.js";
import { buildEvidenceSummary, buildFrameRefs } from "./AssetMessages.js";
import { loadClientProvidedInput } from "./ClientProvided.js";
import { buildClientProvidedMetadata, clientProvidedDepth, markClientProvidedPlan } from "./ClientProvidedRoute.js";
import { parseComposerInput } from "./InputIntent.js";
import { describeConnection, persistResolvedConfig } from "./SetupActions.js";
import { renderShell } from "./Shell.js";
import { applyTaskStepEvent, completeTaskSteps } from "./TaskEvents.js";

type Stage = "input" | "plan" | "run" | "fallback" | "done";
type ComposerMode = "source" | "local_file" | "subtitle" | "export_dir" | "api_url";

export class App implements Component {
  tui: TUI;
  transport: Transport;
  config: ResolvedV2Config;
  
  theme: ThemeKey = "ink-night";
  stage: Stage = "input";
  activeScreen: "home" | "chat" | "setup" | "protocol" = "home";
  selectedActionIndex = 0;
  
  skillIdx = 0;
  skills: SkillInfo[] = DEFAULT_SKILLS;
  meta: VideoMetadata | null = null;
  plan: AnalysisPlan | null = null;
  plannedDepth: Depth | null = null;
  progress = 0;
  steps: Record<string, StepState> = {};
  taskRef: TaskRef | null = null;
  runId: string | null = null;
  runOutputPath: string | null = null;
  runResult: RunResult | null = null;
  assetLoadError: string | null = null;
  composerHint: string | null = null;
  composerMode: ComposerMode = "source";
  mascot = "•ω•";
  err: BackendError | null = null;
  doctor: DoctorSummary | null = null;
  recentTasks: RecentTask[] = [];
  selectedRecentIndex = 0;
  unsub: (() => void) | null = null;
  
  urlInput: Input;
  chatInput: Input;
  chatHistory: Array<{ role: "user" | "assistant"; text: string }> = [];

  constructor(tui: TUI, transport: Transport, config: ResolvedV2Config = resolveV2Config()) {
    this.tui = tui;
    this.transport = transport;
    this.config = config;
    
    this.urlInput = new Input();
    this.urlInput.focused = true;
    this.urlInput.onSubmit = (val) => {
      void this.handleComposerSubmit(val);
    };
    
    this.chatInput = new Input();
    this.chatInput.onSubmit = (val) => {
      this.handleChatSubmit(val);
    };
    
    void this.loadBackendOverview();
  }

  focused = false;
  focusedElement: Component | null = null;

  setFocus(component: Component | null) {
    this.focusedElement = component;
    this.tui.setFocus(component);
  }
  
  invalidate() {}

  reset() {
    this.unsub?.();
    this.unsub = null;
    this.stage = "input";
    this.selectedActionIndex = 0;
    this.meta = null;
    this.plan = null;
    this.plannedDepth = null;
    this.progress = 0;
    this.steps = {};
    this.taskRef = null;
    this.runId = null;
    this.runOutputPath = null;
    this.runResult = null;
    this.selectedRecentIndex = 0;
    this.composerHint = null;
    this.assetLoadError = null;
    this.err = null;
    this.composerMode = "source";
    this.mascot = "•ω•";
    this.setFocus(this.urlInput);
    this.tui.requestRender();
  }

  cycleTheme() {
    const idx = THEME_KEYS.indexOf(this.theme);
    this.theme = THEME_KEYS[(idx + 1) % THEME_KEYS.length];
    this.tui.requestRender();
  }

  cycleSkill() {
    this.skillIdx = (this.skillIdx + 1) % this.skills.length;
    this.tui.requestRender();
  }

  cycleAction() {
    const state = this.renderState(120);
    const count = actionSet(state).length;
    this.selectedActionIndex = count ? (this.selectedActionIndex + 1) % count : 0;
    this.tui.requestRender();
  }

  async loadBackendOverview() {
    const [doctorResult, recentResult, skillsResult] = await Promise.allSettled([
      this.transport.doctor(),
      this.transport.recentTasks(),
      this.transport.skills(),
    ]);

    if (doctorResult.status === "fulfilled") this.doctor = doctorResult.value;
    if (recentResult.status === "fulfilled") {
      this.recentTasks = recentResult.value;
      this.selectedRecentIndex = Math.min(this.selectedRecentIndex, Math.max(0, this.recentTasks.length - 1));
    }
    if (skillsResult.status === "fulfilled" && skillsResult.value.length > 0) {
      this.skills = skillsResult.value;
      this.skillIdx = Math.min(this.skillIdx, this.skills.length - 1);
    }
    this.tui.requestRender();
  }

  toggleScreen(screen: "chat" | "setup" | "protocol") {
    if (this.activeScreen === screen) {
      this.activeScreen = "home";
      this.setFocus(this.stage === "input" ? this.urlInput : null);
    } else {
      this.activeScreen = screen;
      if (screen === "chat") {
        this.setFocus(this.chatInput);
      } else {
        this.setFocus(null);
      }
    }
    this.selectedActionIndex = 0;
    this.tui.requestRender();
  }

  updateScreen(screen: "home" | "chat" | "setup" | "protocol") {
    this.activeScreen = screen;
    if (screen === "chat") {
      this.setFocus(this.chatInput);
    } else if (screen === "home") {
      this.setFocus(this.stage === "input" ? this.urlInput : null);
    } else {
      this.setFocus(null);
    }
    this.selectedActionIndex = 0;
    this.tui.requestRender();
  }

  async goPlan(urlVal: string) {
    if (!urlVal.trim()) return;
    this.composerHint = null;
    this.mascot = "·ω·";
    this.tui.requestRender();
    try {
      const input = parseComposerInput(urlVal, this.skills, this.currentSkill().name);
      const skill = input.skillName ?? this.currentSkill().name;
      this.selectSkillByName(skill);
      const providedPath = input.clientProvidedPath ?? input.subtitlePath;
      const plannedDepth = providedPath ? clientProvidedDepth(this.currentSkill().depth) : this.currentSkill().depth;
      this.plannedDepth = plannedDepth;
      let m: VideoMetadata;
      let p: AnalysisPlan;
      if (providedPath) {
        await loadClientProvidedInput(providedPath);
        m = buildClientProvidedMetadata(input.source, providedPath);
        p = markClientProvidedPlan(await this.transport.plan(input.source, skill, plannedDepth, m));
      } else {
        [m, p] = await Promise.all([
          this.transport.probe(input.source),
          this.transport.plan(input.source, skill, plannedDepth)
        ]);
      }
      this.meta = m;
      this.plan = p;
      this.stage = "plan";
      this.selectedActionIndex = 0;
      this.setFocus(null);
    } catch (e: any) {
      this.err = {
        code: "STEP_FAILED",
        step: "probe",
        message: e.message || String(e),
        hint: "请检查网络连接或输入链接合法性",
        retriable: true,
        degraded_to: null
      };
      this.stage = "fallback";
      this.selectedActionIndex = 0;
      this.setFocus(null);
    }
    this.tui.requestRender();
  }

  async goRun() {
    this.stage = "run";
    this.selectedActionIndex = 0;
    this.progress = 0;
    this.steps = {};
    this.mascot = "·ω·";
    this.tui.requestRender();
    
    const urlVal = this.urlInput.getValue();
    const input = parseComposerInput(urlVal, this.skills, this.currentSkill().name);
    const skill = input.skillName ?? this.currentSkill().name;
    this.selectSkillByName(skill);
    const providedPath = input.clientProvidedPath ?? input.subtitlePath;
    const depth = this.plannedDepth ?? (providedPath ? clientProvidedDepth(this.currentSkill().depth) : this.currentSkill().depth);
    const fail = urlVal.includes("#blocked") ? "blocked" : urlVal.includes("#ratelimit") ? "ratelimit" : urlVal.includes("#oom") ? "oom" : "";
    
    try {
      const request: AnalyzeRequest = {
        url: input.source,
        skill,
        depth
      };
      if (providedPath) {
        request.client_provided = await loadClientProvidedInput(providedPath);
      }
      const taskRef = await this.transport.analyze(request);
      this.taskRef = taskRef;
      this.startTaskStream(taskRef, fail);
    } catch (e: any) {
      this.err = {
        code: providedPath ? "INPUT_CORRUPT" : "STEP_FAILED",
        step: providedPath ? "client_provided_input" : "analyze",
        message: e.message || String(e),
        hint: providedPath ? "请检查字幕或 handoff JSON 的路径、格式和读取权限。" : "服务器暂时不可用，请稍后重试",
        retriable: true,
        degraded_to: null
      };
      this.stage = "fallback";
      this.selectedActionIndex = 0;
      this.tui.requestRender();
    }
  }

  startTaskStream(taskRef: TaskRef, fail = "") {
    this.unsub?.();
    this.unsub = this.transport.streamEvents(taskRef.task_id + (fail ? "__" + fail : ""), (ev) => {
      if (ev.data.progress != null) this.progress = ev.data.progress;

      this.steps = applyTaskStepEvent(this.steps, ev);

      if (ev.event === "error" && ev.data.error) {
        this.err = ev.data.error;
        this.mascot = "×﹏×";
        this.stage = "fallback";
        this.selectedActionIndex = 0;
      }

      if (ev.event === "done") {
        this.steps = completeTaskSteps(this.steps);
        this.runId = ev.data.run_id ?? null;
        this.runOutputPath = ev.data.output_path ?? null;
        if (this.runId) void this.loadRunResult(this.runId);
        void this.loadBackendOverview();
        this.progress = 1;
        this.mascot = "•‿•";
        this.stage = "done";
        this.selectedActionIndex = 0;
      }

      this.tui.requestRender();
    });
  }

  async retryCurrentTask() {
    if (!this.taskRef) return this.goRun();
    this.stage = "run";
    this.selectedActionIndex = 0;
    this.progress = 0;
    this.steps = {};
    this.err = null;
    this.runId = null;
    this.runOutputPath = null;
    this.runResult = null;
    this.assetLoadError = null;
    this.mascot = "·ω·";
    this.tui.requestRender();
    try {
      const taskRef = await this.transport.retryTask(this.taskRef.task_id);
      this.taskRef = taskRef;
      this.startTaskStream(taskRef);
    } catch (e: any) {
      this.err = {
        code: "STEP_FAILED",
        step: "retry",
        message: e.message || String(e),
        hint: "Retry failed. Check backend task status or submit a new analysis.",
        retriable: true,
        degraded_to: null
      };
      this.stage = "fallback";
      this.selectedActionIndex = 0;
      this.tui.requestRender();
    }
  }

  async cancelCurrentTask() {
    this.unsub?.();
    this.unsub = null;
    const taskId = this.taskRef?.task_id;
    if (taskId) {
      try {
        await this.transport.cancelTask(taskId);
      } catch {
        // Local reset still proceeds; backend cancellation failure remains visible in protocol view via task status.
      }
    }
    this.reset();
  }

  async handleChatSubmit(val: string) {
    if (!val.trim()) return;
    this.chatHistory.push({ role: "user", text: val });
    this.chatInput.setValue("");
    this.tui.requestRender();
    
    const thinkingIdx = this.chatHistory.length;
    this.chatHistory.push({ role: "assistant", text: "思考中..." });
    this.tui.requestRender();
    
    try {
      const sourceHash = this.currentSourceHash();
      const historyPayload = this.chatHistory.slice(0, -2).map(h => ({
        role: h.role,
        content: h.text
      }));

      this.chatHistory[thinkingIdx] = { role: "assistant", text: "" };
      const answer = await this.transport.chat({
        question: val,
        source_hash: sourceHash,
        history: historyPayload,
      }, (chunk) => {
        this.chatHistory[thinkingIdx].text += chunk;
        this.tui.requestRender();
      });
      if (!this.chatHistory[thinkingIdx].text) {
        this.chatHistory[thinkingIdx] = {
          role: "assistant",
          text: answer || "当前资产没有可用回答。"
        };
      }
    } catch (e: any) {
      this.chatHistory[thinkingIdx] = {
        role: "assistant",
        text: `Error: ${e.message || "无法连接到分析助手"}`
      };
    }
    this.tui.requestRender();
  }

  currentSourceHash(): string {
    return this.runResult?.source_hash ?? this.taskRef?.source_hash ?? this.meta?.source_hash ?? "";
  }

  async loadRunResult(runId: string) {
    this.assetLoadError = null;
    this.tui.requestRender();
    try {
      this.runResult = await this.transport.getRunResult(runId);
    } catch (e: any) {
      this.assetLoadError = e.message || String(e);
    }
    this.tui.requestRender();
  }

  async executeSelectedAction() {
    const actions = actionSet(this.renderState(120));
    const action = actions[Math.min(this.selectedActionIndex, Math.max(0, actions.length - 1))];
    if (!action) return;
    await this.executeAction(action.id);
  }

  async executeAction(id: ActionId) {
    switch (id) {
      case "analyze_input":
        return this.goPlan(this.urlInput.getValue());
      case "start_analysis":
      case "retry_safest":
        return this.goRun();
      case "cancel_task":
        return this.cancelCurrentTask();
      case "new_analysis":
        return this.reset();
      case "open_chat":
        return this.updateScreen("chat");
      case "open_evidence":
        return this.showEvidenceSummary();
      case "open_frames":
        return this.showFrameRefs();
      case "open_settings":
        return this.updateScreen("setup");
      case "save_setup":
        return this.saveSetup();
      case "test_connection":
        return this.testConnection();
      case "storage_settings":
        return this.prepareExportDirectoryInput();
      case "toggle_live":
        return this.toggleLivePreference();
      case "toggle_offline":
        return this.toggleOfflinePreference();
      case "edit_api_url":
        return this.prepareApiUrlInput();
      case "open_protocol":
        return this.updateScreen("protocol");
      case "back_home":
      case "keep_running":
        return this.updateScreen("home");
      case "use_text_only":
        return this.switchToTextOnlyRoute();
      case "use_lighter_route":
        if (await this.switchToTextOnlyRoute()) return this.goRun();
        return;
      case "open_recent":
        return this.openMostRecentAsset();
      case "next_recent":
        return this.selectNextRecentAsset();
      case "add_file":
      case "use_upload":
        return this.prepareLocalFileInput();
      case "use_clipper":
      case "upload_subtitles":
        return this.prepareSubtitleInput();
      case "prepare_safe_route":
        return this.prepareSubtitleInput();
      case "run_asr":
        return this.goRun();
      case "use_cloud_vlm":
        return this.switchToVlmRoute();
      case "edit_recipe":
        return this.selectNextSkillRoute();
      case "export_note":
        return this.exportCurrentRun();
      case "quit":
        this.tui.stop();
        process.exit(0);
    }
  }

  selectSkillByDepth(depth: Depth): boolean {
    const idx = this.skills.findIndex((skill) => skill.depth === depth);
    if (idx < 0) return false;
    this.skillIdx = idx;
    this.tui.requestRender();
    return true;
  }

  selectSkillByName(name: string): boolean {
    const idx = this.skills.findIndex((skill) => skill.name === name);
    if (idx < 0) return false;
    this.skillIdx = idx;
    this.tui.requestRender();
    return true;
  }

  async switchToTextOnlyRoute(): Promise<boolean> {
    if (!this.selectSkillByDepth("text_only")) return false;
    const url = this.urlInput.getValue();
    if (!url.trim()) return false;
    await this.goPlan(url);
    return this.stage === "plan";
  }

  async switchToVlmRoute(): Promise<boolean> {
    if (!this.selectSkillByDepth("with_vlm")) {
      this.chatHistory.push({
        role: "assistant",
        text: "当前后端没有可用的 with_vlm Skill。请先用 text_only 或 with_frames 路线完成分析。"
      });
      this.updateScreen("chat");
      return false;
    }
    const url = this.urlInput.getValue();
    if (!url.trim()) return false;
    await this.goPlan(url);
    return this.stage === "plan";
  }

  async selectNextSkillRoute() {
    this.cycleSkill();
    const url = this.urlInput.getValue();
    if (!url.trim()) return;
    await this.goPlan(url);
  }

  currentSkill(): SkillInfo {
    return this.skills[this.skillIdx] ?? DEFAULT_SKILLS[0];
  }

  async openMostRecentAsset() {
    const recent = this.recentTasks[this.selectedRecentIndex] ?? this.recentTasks[0];
    if (!recent) return;
    if (!recent.run_id) {
      this.chatHistory.push({
        role: "assistant",
        text: `最近资产缺少 run_id，暂时只能显示标题：${recent.title}`
      });
      this.updateScreen("chat");
      return;
    }

    this.runId = recent.run_id;
    this.assetLoadError = null;
    this.chatHistory.push({ role: "assistant", text: `正在打开最近资产：${recent.title}` });
    this.updateScreen("chat");
    try {
      this.runResult = await this.transport.getRunResult(recent.run_id);
      this.stage = "done";
      this.progress = 1;
      this.chatHistory.push({ role: "assistant", text: `已打开：${this.runResult.metadata?.title ?? recent.title}` });
    } catch (e: any) {
      this.assetLoadError = e.message || String(e);
      this.chatHistory.push({ role: "assistant", text: `打开最近资产失败：${this.assetLoadError}` });
    }
    this.tui.requestRender();
  }

  selectNextRecentAsset() {
    if (this.recentTasks.length <= 1) return;
    this.selectedRecentIndex = (this.selectedRecentIndex + 1) % this.recentTasks.length;
    this.tui.requestRender();
  }

  async handleComposerSubmit(value: string) {
    if (this.composerMode === "export_dir") {
      await this.setExportDirectory(value);
      return;
    }
    if (this.composerMode === "api_url") {
      await this.setApiUrl(value);
      return;
    }
    await this.goPlan(value);
  }

  prepareLocalFileInput() {
    this.composerHint = "Paste local video, audio, image, or subtitle path";
    this.composerMode = "local_file";
    this.activeScreen = "home";
    this.stage = "input";
    this.selectedActionIndex = 0;
    this.setFocus(this.urlInput);
    this.tui.requestRender();
  }

  prepareSubtitleInput() {
    this.composerHint = "Paste: video URL :: local subtitle or handoff JSON path";
    this.composerMode = "subtitle";
    this.activeScreen = "home";
    this.stage = "input";
    this.selectedActionIndex = 0;
    this.setFocus(this.urlInput);
    this.tui.requestRender();
  }

  prepareExportDirectoryInput() {
    this.composerHint = "Paste export directory path";
    this.composerMode = "export_dir";
    this.activeScreen = "home";
    this.stage = "input";
    this.selectedActionIndex = 0;
    this.setFocus(this.urlInput);
    this.tui.requestRender();
  }

  prepareApiUrlInput() {
    this.composerHint = "Paste REST API base URL";
    this.composerMode = "api_url";
    this.activeScreen = "home";
    this.stage = "input";
    this.selectedActionIndex = 0;
    this.setFocus(this.urlInput);
    this.tui.requestRender();
  }

  async setExportDirectory(value: string) {
    const exportDir = value.trim();
    if (!exportDir) return;
    this.config = { ...this.config, exportDir };
    const filePath = await persistResolvedConfig(this.config);
    this.composerMode = "source";
    this.composerHint = null;
    this.chatHistory.push({
      role: "assistant",
      text: `导出目录已保存：${exportDir}\n配置文件：${filePath}`
    });
    this.updateScreen("setup");
  }

  async setApiUrl(value: string) {
    const apiUrl = value.trim().replace(/\/$/, "");
    if (!apiUrl) return;
    this.config = { ...this.config, apiUrl };
    const filePath = await persistResolvedConfig(this.config);
    this.composerMode = "source";
    this.composerHint = null;
    this.chatHistory.push({
      role: "assistant",
      text: `REST API 地址已保存：${apiUrl}\n配置文件：${filePath}\n重启 ov 后生效。`
    });
    this.updateScreen("setup");
  }

  async toggleLivePreference() {
    this.config = { ...this.config, live: !this.config.live };
    const filePath = await persistResolvedConfig(this.config);
    this.chatHistory.push({
      role: "assistant",
      text: `启动模式已保存：${this.config.live ? "live REST" : "mock/demo"}\n配置文件：${filePath}\n重启 ov 后生效。`
    });
    this.updateScreen("setup");
  }

  async toggleOfflinePreference() {
    this.config = { ...this.config, offline: !this.config.offline };
    const filePath = await persistResolvedConfig(this.config);
    this.chatHistory.push({
      role: "assistant",
      text: `离线偏好已保存：${this.config.offline ? "enabled" : "disabled"}\n配置文件：${filePath}`
    });
    this.updateScreen("setup");
  }

  async saveSetup() {
    const filePath = await persistResolvedConfig(this.config);
    this.chatHistory.push({
      role: "assistant",
      text: `V2 启动配置已保存：${filePath}`
    });
    this.updateScreen("setup");
  }

  async testConnection() {
    await this.loadBackendOverview();
    this.chatHistory.push({
      role: "assistant",
      text: `连接测试：${describeConnection(this.config, this.doctor)}`
    });
    this.updateScreen("setup");
  }

  async exportCurrentRun() {
    const runId = this.runId ?? this.runResult?.run_id;
    if (!runId) {
      this.chatHistory.push({
        role: "assistant",
        text: "还没有可导出的运行结果。请先完成一次分析。"
      });
      this.updateScreen("chat");
      return;
    }

    const title = this.runResult?.metadata?.title ?? this.meta?.title ?? "OmniVerse Vision Export";
    const vaultDir = this.config.exportDir;
    this.chatHistory.push({ role: "assistant", text: `正在导出到本地 Obsidian/Markdown 目录：${vaultDir}` });
    this.updateScreen("chat");

    try {
      const result = await this.transport.exportRun({
        runId,
        provider: "obsidian",
        title,
        options: {
          vault_dir: vaultDir,
          overwrite: false,
        },
      });
      this.chatHistory.push({
        role: "assistant",
        text: `导出完成：${result.path ?? result.url ?? JSON.stringify(result)}`
      });
    } catch (e: any) {
      this.chatHistory.push({
        role: "assistant",
        text: `导出失败：${e.message || String(e)}`
      });
    }
    this.tui.requestRender();
  }

  showEvidenceSummary() {
    if (!this.runResult) {
      this.chatHistory.push({
        role: "assistant",
        text: "还没有可浏览的证据资产。请先完成一次分析。"
      });
      this.updateScreen("chat");
      return;
    }
    this.chatHistory.push({
      role: "assistant",
      text: buildEvidenceSummary(this.runResult)
    });
    this.updateScreen("chat");
  }

  showFrameRefs() {
    if (!this.runResult?.shots.length) {
      this.chatHistory.push({
        role: "assistant",
        text: "当前资产没有可用帧引用。请使用 with_frames / with_vlm 深度重新分析。"
      });
      this.updateScreen("chat");
      return;
    }
    this.chatHistory.push({
      role: "assistant",
      text: buildFrameRefs(this.runResult)
    });
    this.updateScreen("chat");
  }

  renderState(width: number) {
    return {
      theme: this.theme,
      stage: this.stage,
      activeScreen: this.activeScreen,
      selectedActionIndex: this.selectedActionIndex,
      width,
      url: this.urlInput.getValue(),
      urlInputLine: this.urlInput.render(74)[0] || "",
      chatInputLine: this.chatInput.render(40)[0] || "",
      composerHint: this.composerHint,
      config: this.config,
      chatHistory: this.chatHistory,
      taskRef: this.taskRef,
      recentTasks: this.recentTasks,
      selectedRecentIndex: this.selectedRecentIndex,
      runId: this.runId,
      runOutputPath: this.runOutputPath,
      runResult: this.runResult,
      assetLoadError: this.assetLoadError,
      skillName: this.currentSkill().name,
      skills: this.skills,
      doctor: this.doctor,
      meta: this.meta,
      plan: this.plan,
      progress: this.progress,
      steps: this.steps,
      err: this.err,
      mascot: this.mascot,
    };
  }

  render(width: number): string[] {
    return renderShell(this.renderState(width));
  }
}

export function launchApp(transport: Transport, config: ResolvedV2Config) {
  const terminal = new ProcessTerminal();
  const tui = new TUI(terminal);
  
  const app = new App(tui, transport, config);
  tui.addChild(app);
  app.setFocus(app.urlInput);
  tui.start();
  
  tui.addInputListener((data) => {
    const compactInput = data.replace(/[\r\n]/g, "");
    if (data === "\u0003") {
      tui.stop();
      process.exit(0);
    }
    if (matchesKey(data, "f1") || data === "\u001bOP") {
      app.toggleScreen("setup");
      return { consume: true };
    }
    if (matchesKey(data, "f2") || data === "\u001bOQ") {
      app.cycleTheme();
      return { consume: true };
    }
    if (matchesKey(data, "f3") || data === "\u001bOR") {
      app.toggleScreen("chat");
      return { consume: true };
    }
    if (matchesKey(data, "f4") || data === "\u001bOS") {
      app.toggleScreen("protocol");
      return { consume: true };
    }
    if (data === "2" && app.focusedElement !== app.urlInput && app.focusedElement !== app.chatInput) {
      app.cycleTheme();
      return { consume: true };
    }
    if (matchesKey(data, "escape")) {
      if (app.activeScreen !== "home") {
        app.updateScreen("home");
        return { consume: true };
      } else {
        if (app.stage === "input") {
          tui.stop();
          process.exit(0);
        } else if (app.stage === "run") {
          void app.cancelCurrentTask();
          return { consume: true };
        } else {
          app.reset();
          return { consume: true };
        }
      }
    }
    if (data === "q" && app.focusedElement !== app.urlInput && app.focusedElement !== app.chatInput) {
      tui.stop();
      process.exit(0);
    }

    if ((compactInput === "s" || compactInput === "S") && app.activeScreen === "setup" && app.focusedElement !== app.urlInput && app.focusedElement !== app.chatInput) {
      void app.saveSetup();
      return { consume: true };
    }
    
    if (matchesKey(data, "enter") || data === "\r" || data === "\n" || data === "\r\n") {
      if (app.focusedElement !== app.urlInput && app.focusedElement !== app.chatInput) {
        void app.executeSelectedAction();
        return { consume: true };
      }
    }
    
    if (matchesKey(data, "tab")) {
      if (app.stage === "input" && app.activeScreen === "home" && app.focusedElement === app.urlInput) {
        app.cycleSkill();
      } else {
        app.cycleAction();
      }
      return { consume: true };
    }
  });

  return {
    cleanup() {
      tui.stop();
    }
  };
}
