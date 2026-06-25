# 40 · Internal Action Registry 规格与样板闭环（执行级单一真相）

> 状态日期：2026-06-25
> 定位：`docs/38`（方向）的**执行级单一真相**，也是“能力域文档包”的样板（产品边界 / UI 挂点 / 前后端契约 / Agent 调用 / 权限 / Timeline·撤销 / 持久化 / 验收 / 状态 一文写齐）。
> 类型唯一真相**已落为代码**：`app/packages/shared/src/protocol/internal-action.ts`（`InternalActionDefinition` / `ActionSurface` / `ActionTargetRef` / `ActionInvocation` / `InternalActionRegistry`，已隔离 typecheck 通过并接入 `protocol/index.ts`）。**字段以该文件为准，本文是设计说明与样板**；冲突时改文档不改类型。`FleetSkillManifest` 属 Recorder/Skill 域，唯一定义在 `docs/39 §5.7`。
> 必读前置：`docs/38`（方向）→ 本文 → `docs/39`（Recorder 怎么消费 action）。
> 当前代码状态：S1 已在当前工作区落到代码并通过目标验证；后端/Agent/RPC/Files 人类入口的代码与功能链路为 `usable`，人工视觉点验待用户完成。已落项包括注册表、files 写服务、`evaluatePermission` 查注册表、两个通用 Agent 工具、renderer → RPC → executor → permission/timeline 的 Files rename/undo 路径；仍属候选/待提交，人工视觉点验、提交主线并复核后再升已落主线。

---

## 0 · 一句话规格

**每个 Fleet 内部写能力 = 注册表里的一条 `InternalActionDefinition`（静态契约，带版本） + 运行时一封 `ActionInvocation`（动态调用，带前置条件/幂等） + 一条 `SessionEvent`（可回放） + 一个 `undoHandle`（可撤销）。人类按钮和 Agent 工具调用同一 `id`，权限等级以注册表为唯一来源。**

---

## 1 · 为什么需要“注册表”，而不只是“信封”

`design.ts` 已有**动作信封**（人点鼠标和 Agent 调工具产出同类可审计记录）。但信封只回答“一次调用长什么样”，不回答：软件一共有哪些内部 action（Agent 要能 `list` 才能调）、每个 action 的 schema/权限/撤销/版本在哪声明、哪些人能点 Agent 也能调、Recorder/Skill 怎么按 `id` 引用。注册表补这一层：**把“信封能装什么”从隐式（散在各 handler）变成显式（可枚举、可校验、可版本化、可被 Agent 读取的目录）。**

---

## 2 · 规范类型：`InternalActionDefinition`（静态契约 · 唯一真相）

实现放 `app/packages/shared/src/protocol/internal-action.ts`（新建，Lead 冻结的共享契约）。

```ts
export interface InternalActionDefinition {
  /** 全局唯一稳定 id，命名 `surface.verb[_qualifier]`，如 `files.move_entry`。 */
  id: string

  /** 契约版本（schema + 行为语义的版本）。schema/行为变更必须升版本，旧版本走 §2.1 迁移。 */
  contractVersion: number

  surface: ActionSurface                 // §3 闭合词表
  verb: 'read' | 'select' | 'mutate' | 'intent' | 'undo' | 'explain'   // §6 六动词

  title: string
  description: string

  inputSchema: unknown                   // JSON Schema 或 zod，全局统一择一
  outputSchema?: unknown

  /** 权限等级，且**这是该 action 权限的唯一来源**（§5）。 */
  permissionLevel: 'L0' | 'L1' | 'L2' | 'L3'

  timelineEvent: string                  // 写操作发出的 SessionEvent type；只读用 `internal_action_invoked`

  undoHandle: {
    type: 'native-history' | 'inverse-patch' | 'snapshot' | 'none'
    noneReason?: string                  // type==='none' 必填
    schema?: unknown
  }

  humanEntryPoints: string[]             // 精确到组件/挂点；证明“人能做一次”
  agentCallable: boolean                 // 是否可被 Agent 用同一 id 调用
  locality: 'LOCAL_ONLY' | 'REMOTE_ELIGIBLE'   // AGENTS 14
  replayPolicy: 'semantic' | 'requiresHuman' | 'visualFallback'  // docs/39
  redactionPolicy?: string[]             // 哪些 input/output 字段在证据/录制里必须脱敏

  requiredCapabilities?: Array<'mcp' | 'cli' | 'api' | 'browser' | 'external-job'>

  contextSummary: {                      // 服务“少即是多 / 低 token”
    reads: string[]; writes: string[]; tokenHint: 'tiny' | 'small' | 'medium' | 'large'
  }

  // —— 版本演进（P1b：UI 变了，动作用迁移函数跟着变，而不是失效）——
  deprecates?: string[]                  // 本 action 取代了哪些旧 id
  replacedBy?: string                    // 本 action 已被哪个新 id 取代（弃用时填）
  payloadMigrations?: Array<{            // 旧契约 payload → 新契约 payload 的迁移
    fromVersion: number; toVersion: number
    migrate: string                      // 迁移函数引用（注册在 action-migrations.ts）
  }>
}
```

### 2.1 · 版本与迁移：这就是“界面变、动作不失效”的工程落点

用户的核心诉求之一是：**软件做优化/调整时，整套操作方式也能用函数/公式跟着一起变，旧流程不报废。** 注册表用三件事实现：

1. **`contractVersion`**：schema 或行为语义一变就升版本；旧 Skill/Trace 记的是 `actionDefinitionId@version`，能判断该按哪个契约回放。
2. **`payloadMigrations`**：旧版本 payload 经迁移函数升到新契约（如字段改名、坐标→语义 ref、单位换算），旧录制不必重录。
3. **`deprecates`/`replacedBy`**：能力换实现时，旧 id 标 `replacedBy` 并提供迁移，Recorder/Skill 自动改调新 id；不是直接 404。

> 没有这层，UI 一改版，所有录好的 Skill 全部失效——正是 `docs/38` 要避免的“跟着外部环境频繁返工”。

### 2.2 · 硬约束（实现校验项）

1. `id` + `contractVersion` 唯一；schema/行为变更必须升版本并给迁移，不得原地改义。
2. 写操作（`verb==='mutate'` 或 `permissionLevel ≥ L2`）必须有非 `none` 的 `undoHandle`，否则 `noneReason` 写明原因。
3. `humanEntryPoints` 与 `agentCallable` 至少一边非空/为真；禁止只有 renderer 暗状态、Agent 不可复现的关键写动作（D7/AGENTS 19）。
4. 本机 OS 能力（文件/PTY/BrowserView/CLI）`locality='LOCAL_ONLY'`。
5. `permissionLevel` 必须真实进入权限判定（§5），不得只写在文档里。

---

## 3 · 闭合 surface 词表：`ActionSurface`（P1c：不再用 `(string & {})`）

`docs/41` P2 登记了三套不一致取值。本文定**闭合**核心词表（无 `(string & {})` 任意字符串逃逸位），新增 surface 走受版本控制的扩展注册，不是随便拼字符串——否则“唯一 surface 词表”、稳定过滤、权限矩阵、Skill 校验都做不实。

```ts
// 闭合核心枚举：不允许任意字符串。
export type ActionSurface =
  // 脊柱 / 横切
  | 'session' | 'files' | 'library' | 'team' | 'manager' | 'skill' | 'settings' | 'external-job'
  // 四个专业工作面
  | 'canvas' | 'aigc' | 'web-doc' | 'video'
  // 代码
  | 'code'

// 扩展只能通过受控注册表新增，带 owner + 引入版本，校验后才生效。
export interface SurfaceExtension { id: string; owner: string; addedInVersion: number; description: string }
export const EXTENSION_SURFACES: readonly SurfaceExtension[] = [] as const
export type RegisteredSurface = ActionSurface | (typeof EXTENSION_SURFACES)[number]['id']
```

**`design.ts` 的 `WorkbenchSurface`（Stage 对象位置）→ `ActionSurface`（能力归属）映射**（常量表放 `internal-action.ts`）：

| `WorkbenchSurface` | `ActionSurface` |
|---|---|
| `browser` / `document` | `web-doc` |
| `artifact` / `board` | `canvas` |
| `timeline` | `video` |
| `code` | `code` |

> `WorkbenchSurface` 是“被选中的视觉对象长在哪个 Stage 面”（6 值，design.ts）；`ActionSurface` 是“action 属于哪类能力”（闭合，本文）。二者不同义，见 §4 为什么 files 不能复用 `WorkbenchSurface`。

---

## 4 · 对象模型与调用信封（P0a 收口）

### 4.1 · `ActionTargetRef`：注册表的通用目标引用（不复用 Stage 选区）

`design.ts` 的 `WorkbenchObjectRef.surface` 是闭合 Stage 枚举（无 `files`）。**让文件伪装成 `browser` 选区会让权限、回放、过滤全部漂移**（外部审查 P0a）。所以注册表用一个**与 Stage 无关**的通用目标引用：

```ts
export interface ActionTargetRef {
  surface: ActionSurface                 // 能力域（闭合词表）
  kind: string                           // 该面下的对象种类：'file'|'dir'|'session'|'doc_block'|'design_node'|'clip'...
  locator: Record<string, unknown>       // 对 spine 不透明的稳定定位锚（文件=path、文档=blockId、设计=nodeId...）
  revision?: string                      // 目标版本/hash/mtime，用于前置条件与回放
  preview?: { text?: string; screenshot?: string }
}
```

分工（不互相伪装）：

- **视觉 Stage 面**（canvas/web-doc/video）的选区继续用 `design.ts` 的 `DesignSelection.objects: WorkbenchObjectRef[]`（surface∈`WorkbenchSurface`）。
- **非视觉面**（files/session/team/manager/skill/settings/library）的目标用 `ActionTargetRef`（surface∈`ActionSurface`）。
- 需要把视觉选区喂给通用 action 时，用 §3 映射把 `WorkbenchObjectRef` 投影成 `ActionTargetRef`，**单向投影，不反向塞**。

> files 的对象就是 `ActionTargetRef{surface:'files', kind:'file'|'dir', locator:{path}, revision}`，不再借 `library_item`/`browser`。

### 4.2 · `ActionInvocation`：一次调用的信封（含前置条件 / 幂等 / 失败策略）

```ts
export interface ActionInvocation {
  actionDefinitionId: string              // 注册表里的稳定 action id，如 `files.move_entry`
  contractVersion: number                // 调用方按哪个契约发起；不匹配则走迁移或拒绝
  actor: ActorRef                         // design.ts 的 ActorRef（user / agent+agentId/runtime/role）
  input: unknown                          // 按注册项 inputSchema 校验
  target?: ActionTargetRef
  idempotencyKey?: string                 // 同 key 重试不重复执行（P0c）
  preconditions?: Array<{                 // 目标仍处于预期状态才执行；否则按 failurePolicy
    targetRevision?: string; assert: string
  }>
  failurePolicy?: 'abort' | 'rollback' | 'ask-user'
}
```

运行时落到现有 `DesignAction` 信封：`DesignAction.actionId` 保持“一次调用/patch 关联 id”，新增 `actionDefinitionId?: string` + `contractVersion?: number` 引用注册项；`ActionInvocation` 是它的语义视图。**不新增第二套执行链路**，仍走 `proposeAction → permission → 面 applier → SessionEvent → DesignPatch.inverse(undo)`。

### 4.3 · 完整生命周期

```
人类点按钮 ┐  按 actionDefinitionId+version 发起 ActionInvocation
           ├─────────────────────────────► registry.get(id) 取 schema/permissionLevel/undo/迁移
Agent 调工具┘                                     │  校验 input、迁移旧 payload、检查 preconditions
                                                  ▼
                         permission 门（level = 注册项 permissionLevel，§5）
                                                  ▼
                         面 applier 执行 → DesignPatch{forward, inverse}
                                                  ▼
                         emit SessionEvent(type = 注册项 timelineEvent, 带 actor)
                                                  ▼
                         undo：inverse-patch / native-history / snapshot（带 precondition 校验）
```

---

## 5 · 权限接线（P0b 收口：Registry 是 permissionLevel 唯一来源）

**现状缺陷（已核实，design-engine.ts:200-237 的 `evaluatePermission`）：**

- 它**不读任何注册表**，`level` 来自 `decision` 标志或硬编码。
- 行 215-217：只要 `isHuman`（`origin==='human_ui'`）就 `required:false, level:'L1'`。**人类亲手发起的 L2 写文件会被直接预授权、永不弹权限**——这违反 D12/AGENTS 26（L2 写文件需规则/预授权，L3 必确认，对人和 Agent 一致）。

**必须改成：**

1. `proposeAction` 先 `const def = registry.get(invocation.actionDefinitionId, invocation.contractVersion)`，把 `def.permissionLevel` 作为权威等级传入权限判定。
2. 判定按 `permissionLevel` 决策，对两类 actor 一致：
   - `L0`：只读，`required:false`。
   - `L1`：低风险本地，人发起可 `required:false`；Agent 发起默认 `required:true`，有预授权规则可降。
   - `L2`：**人和 Agent 都要过门**——有匹配规则/预授权才 `required:false`（记 `ruleRef`），否则 `required:true`。不再因 `isHuman` 静默放行。
   - `L3`：无论谁发起，`required:true, requiresExplicitConfirm:true`，预授权不能代答。
3. `permissionLevel` 不在调用方传入、不可被 `decision` 覆盖；唯一来源是注册项。

修正后判定（伪码）：

```ts
function evaluatePermission(inv, def, decision) {
  const lvl = def.permissionLevel
  if (lvl === 'L3') return { required: true, level: 'L3', requiresExplicitConfirm: true, ... }
  if (lvl === 'L0') return { required: false, level: 'L0', ... }
  if (lvl === 'L1') return { required: !isHuman(inv) && !decision.hasPreAuth, level: 'L1', ... }
  // L2：人和 Agent 一致，只有规则/预授权能免确认
  return decision.hasPreAuth
    ? { required: false, level: 'L2', ruleRef: decision.ruleRef, ... }
    : { required: true, level: 'L2', ... }
}
```

---

## 6 · 第一个样板闭环：`files` 面（inspect / select / edit / undo）

选 `files`：读路径已有 `fs:listEntries` + `FilesListPanel`，写路径风险最低，撤销语义清晰。第二样板推荐 `web-doc`（文档块）。

### 6.1 · 四条注册项

| id | verb | 权限 | timelineEvent | undoHandle | 复用/新增 |
|---|---|---|---|---|---|
| `files.inspect_workspace` | read | L0 | `internal_action_invoked` | none（只读） | 复用 `fs:listEntries` |
| `files.select_entry` | select | L0 | `internal_action_invoked` | none（选区） | 产出 `ActionTargetRef` |
| `files.move_entry` | mutate | **L2** | `file_entry_moved` | inverse-patch | **新增** `file-mutation-service`（含 §6.3 安全约束） |
| `files.undo_last_edit` | undo | L1 | `file_edit_undone` | —（执行 inverse，带 precondition） | **新增** |

> 删除（L3）**不进第一版**——undo 需快照/回收站，单独立项。

### 6.2 · 关键字段（edit / undo，已补安全与前置条件）

```ts
// edit —— 重命名/移动（同目录改名 + 跨目录移动；可逆）
{
  id: 'files.move_entry', contractVersion: 1,
  surface: 'files', verb: 'mutate',
  title: '重命名或移动文件', description: '把选中的文件/目录移动到新路径，产出可逆 DesignPatch',
  inputSchema: { fromPath: string, toPath: string },
  outputSchema: { patchId: string, fromPath, toPath, fromRevision: string },
  permissionLevel: 'L2', timelineEvent: 'file_entry_moved',
  undoHandle: { type: 'inverse-patch' },                       // inverse = move(toPath -> fromPath)
  humanEntryPoints: ['Files 模块「重命名/移动」（接通前 disabled）'],
  agentCallable: true, locality: 'LOCAL_ONLY', replayPolicy: 'semantic',
  redactionPolicy: ['fromPath', 'toPath'],                     // 路径可能含项目/个人信息，不默认非敏感
  contextSummary: { reads: ['workspace.entry'], writes: ['workspace.fileTree'], tokenHint: 'tiny' },
}

// undo —— 撤销上一次文件编辑（带前置条件，避免误覆盖）
{
  id: 'files.undo_last_edit', contractVersion: 1,
  surface: 'files', verb: 'undo',
  title: '撤销上一次文件编辑',
  inputSchema: { patchId?: string },
  outputSchema: { undonePatchId: string },
  permissionLevel: 'L1', timelineEvent: 'file_edit_undone',
  undoHandle: { type: 'none', noneReason: '撤销动作本身不再注册二次撤销' },
  humanEntryPoints: ['Files 模块「撤销」/ 全局撤销'],
  agentCallable: true, locality: 'LOCAL_ONLY', replayPolicy: 'semantic',
  contextSummary: { reads: ['session.lastPatch'], writes: ['workspace.fileTree'], tokenHint: 'tiny' },
}
```

### 6.3 · `files.move_entry` 安全与前置条件（P0c · 实现必须满足）

`file-mutation-service` 在执行前必须全部通过，否则拒绝并返回可操作错误：

1. **工作区根约束**：`resolveWithinWorkspace(rootPath, fromPath|toPath)`：先 `path.normalize` + `realpath`，拒绝 `..` 逃逸、拒绝绝对路径逃逸、拒绝 symlink 指向 root 外。两端都必须落在当前 workspace（或用户已授权的素材目录）内。
2. **不覆盖**：`toPath` 已存在 → 报错（或要求显式确认），绝不静默覆盖。
3. **源未变前置条件**：记录 `fromRevision`（mtime+size，或内容 hash）；执行瞬间若 `fromPath` 的 revision 与调用时不一致 → 中止（源被用户/外部改过）。
4. **幂等**：相同 `idempotencyKey` 重试不重复移动。
5. **inverse 前置条件**：`undo` 前校验 `toPath` 仍处于 move 后的 revision；若已被再次修改 → `failurePolicy:'ask-user'`，让用户确认，不盲目 `move(toPath->fromPath)` 覆盖新内容。
6. **跨卷/权限失败**：原子 rename 失败（跨文件系统、只读、占用）→ 明确分类错误，不留半完成状态。

### 6.4 · 文件级落地清单

| 层 | 文件 | 改动 |
|---|---|---|
| 契约（Lead 冻结） | `packages/shared/src/protocol/internal-action.ts`（新建） | `InternalActionDefinition`/`ActionSurface`/`ActionTargetRef`/`ActionInvocation` + 映射常量 |
| 契约（Lead 冻结） | `packages/shared/src/protocol/design.ts` | `DesignAction` 保留 `actionId` 作为 invocation/patch id，新增 `actionDefinitionId?`/`contractVersion?`；`DesignActionOp` 增 `file_move` 信封（payload 不透明） |
| 注册表 | `packages/server-core/src/services/internal-action-registry.ts`（+ test） | 注册/枚举/取元数据/版本解析/迁移分发；登记四条 files action |
| 引擎接线 | `packages/server-core/src/services/design-engine.ts` | `proposeAction` 查注册表取 `permissionLevel`/schema/undo；**改 `evaluatePermission` 按 §5** |
| 写服务 | `packages/server-core/src/services/file-mutation-service.ts`（+ test） | `move` + `DesignPatch{forward,inverse}` + §6.3 全部安全约束 |
| Agent 工具 | `packages/session-tools-core/src/handlers/internal-action.ts`（+ test） | `list_internal_actions` / `invoke_internal_action` 两个通用工具 |
| RPC/UI 接线 | `handlers/rpc/internal-actions.ts` + `transport/channel-map.ts` + `shared/types.ts` | `internalActions:list/invoke` LOCAL_ONLY 通道；renderer 暴露同一 action 调用 |
| 人类 UI | `renderer/.../WorkspaceContextSidebar.tsx` + `FilesListPanel` | 重命名/撤销入口，调同一 action；无 active session 时不显示写入口 |
| 同步 | bundled docs / tool schema / MCP 说明 | 按 AGENTS 35 |

---

## 7 · Agent 暴露方式（关乎 token）

不给每个 action 各做一个工具（撑爆工具表、违反“少即是多”）。用**两个通用工具**覆盖整张注册表：

- `list_internal_actions(surface?, verb?)` → 返回 `id/title/contractVersion/inputSchema/permissionLevel` 摘要（Agent 据此发现能力）。
- `invoke_internal_action(invocation: ActionInvocation)` → 按 `actionDefinitionId`+version 调用，内部走 §4.3 链路。

工具表恒为常数级；Agent 读 schema 而非截图（低 token），每次调用天然进 permission/timeline/undo。

---

## 8 · 验收（`usable` 硬标准）

> 人能做一次，Agent 用同一 `id` 做一次，进 timeline，可撤销，有权限。

- [x] 人在 Files 重命名 → renderer 调 `files.move_entry`；后端发 `file_entry_moved`（actor=user）。状态：代码/功能链路 `usable`，人工视觉点验待用户完成。
- [x] Agent `invoke_internal_action('files.move_entry',…)` → 同一 executor / 同一 timeline（actor=agent+agentId/runtime/role）。
- [x] **L2 人类写也弹权限**（不再因 `isHuman` 静默 L1 放行，§5）；L3 永远显式确认。
- [x] `files.move_entry` 满足 §6.3 安全约束：根约束、不覆盖、源未变、幂等、跨卷/权限错误分类。
- [x] `files.undo_last_edit` 在 `toPath` 被再次修改时拒绝盲目覆盖。
- [x] `list_internal_actions('files')` 返回四条；Agent 不靠截图/DOM 发现能力。
- [x] 未接通写按钮 `disabled` 或明确报错（AGENTS 23）。
- [x] `./scripts/craft.sh run typecheck:all` + 目标测试通过；`git diff --check` 干净。

只写 UI / 只接 RPC / 只加 MCP / 只跑截图自动化 → 一律 `display-only` 或 `wired but not visually checked`，不算完成。

---

## 9 · Skill / Recorder 怎么引用

`FleetSkillManifest` 唯一定义在 `docs/39 §5.7`。Skill 用 `allowedInternalActions: string[]` 按 `id`（必要时 `id@contractVersion`）引用本注册表。回放主路径 = `replayPolicy:'semantic'` 的 action；坐标/DOM/Computer Use 只能标 `fragileFallbacks`（对应 `replayPolicy:'visualFallback'`）。Recorder 录的是 `actionDefinitionId + contractVersion + 入参 + actor + permission + result + inverse`，不是录屏。

---

## 10 · 反模式

- 再造和 `DesignAction` 平行的执行链路（应复用信封，§4.2）。
- 给每个 action 各做一个工具（应只用 `list/invoke`，§7）。
- 让 files/session/team 等非视觉目标复用 `WorkbenchObjectRef`/`WorkbenchSurface`（应用 `ActionTargetRef`，§4.1）。
- 把 `permissionLevel` 写在文档却不接进 `evaluatePermission`（§5）。
- 文件写不做根约束/不覆盖/源未变/幂等校验（§6.3）。
- `ActionSurface` 又开 `(string & {})` 任意字符串（§3）。
- schema/行为变更不升 `contractVersion`、不给迁移（§2.1）。

---

## 11 · 与其它文档的关系

- 方向：`docs/38`（本文是其执行展开）。
- Recorder/Skill 与 manifest：`docs/39`。
- 信封现状：`app/packages/shared/src/protocol/design.ts` + `docs/31 §1`。
- 问题登记与方向收口：`docs/41`。
- 路线位置：`docs/01 §5` M0 第 6 项的可执行版。
