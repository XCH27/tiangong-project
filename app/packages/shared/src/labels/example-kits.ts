import type { ExpertSkill } from './skill-routing'

/**
 * Two example kits, shipped as data.
 *
 * These exist to pin the *shape* — what a kit author has to declare and what the
 * router needs to work — not to be good design or engineering advice. The
 * instruction bodies are placeholders; the triggers, exclusions and chains are
 * the part worth reading, because they are what makes a large catalog cheap.
 *
 * They deliberately differ in size. One is small enough to load whole; the other
 * is large enough that loading it whole would blow the attention budget, which
 * is the case routing exists for. A framework that only ever sees small kits
 * would not have needed routing at all.
 */

// ── A small kit: fits in the window, routing is optional ────────────────────

/**
 * Six skills. Under the focused threshold, so this loads whole and routing only
 * sharpens which one leads.
 */
export const EXAMPLE_CODE_REVIEW_KIT: readonly ExpertSkill[] = [
  {
    id: 'review.diff',
    name: 'Read the diff',
    body: 'Summarize what changed and why, before judging any of it.',
    triggers: ['review', 'diff', 'what changed', '审查', '改了什么'],
    excludes: ['write a test', 'generate code'],
    downstream: ['review.risk', 'review.tests'],
  },
  {
    id: 'review.risk',
    name: 'Find the risk',
    body: 'Identify the change most likely to break something, and say why.',
    triggers: ['risk', 'dangerous', 'what could break', '风险'],
    downstream: ['review.tests'],
  },
  {
    id: 'review.tests',
    name: 'Check the tests',
    body: 'Decide whether the tests would fail if the behaviour regressed.',
    triggers: ['tests', 'coverage', '测试'],
    downstream: ['review.summary'],
  },
  {
    id: 'review.security',
    name: 'Security pass',
    body: 'Look for injection, secret handling, and permission bypass.',
    triggers: ['security', 'injection', 'secret', '安全'],
  },
  {
    id: 'review.perf',
    name: 'Performance pass',
    body: 'Look for N+1 access, unbounded loops, and blocking work.',
    triggers: ['performance', 'slow', 'n+1', '性能'],
  },
  {
    // No triggers on purpose: this only ever follows a review, and the catalog
    // audit reports it as `chain-only` rather than unreachable.
    id: 'review.summary',
    name: 'Write the summary',
    body: 'Produce the review comment: what to change, in what order.',
    triggers: [],
  },
]

// ── A large kit: routing is what makes it usable ────────────────────────────

/**
 * Eighteen skills spanning a whole workflow.
 *
 * Loading all of these at once would be roughly the accuracy cliff the budget
 * describes. Split into three kits it would be worse for the user, who has to
 * choose a kit before knowing which step they are on. Routed, a request touches
 * two or three.
 *
 * The exclusions carry most of the weight here: several steps share vocabulary
 * with a product-management workflow, and without exclusions the larger catalog
 * would absorb every ambiguous request simply by having more surface to match.
 */
export const EXAMPLE_PRODUCT_DESIGN_KIT: readonly ExpertSkill[] = [
  {
    id: 'design.frame',
    name: 'Frame the problem',
    body: 'Turn a vague direction into a stated problem and an audience.',
    triggers: ['问题框定', 'frame the problem', 'new direction', '新方向', '不知道从哪开始'],
    // The product-management kit owns PRD authoring; without this, "write a PRD"
    // lands here because this kit mentions requirements more often.
    excludes: ['写 prd', 'write a prd', '产品需求文档'],
    downstream: ['design.brief', 'design.research'],
  },
  {
    id: 'design.read-requirements',
    name: 'Read the requirements',
    body: 'Extract design-relevant fields from an existing PRD and mark the gaps.',
    triggers: ['读需求', 'read the prd', 'here is the prd', '需求文档'],
    excludes: ['写 prd', 'write a prd'],
    downstream: ['design.brief'],
  },
  {
    id: 'design.research',
    name: 'Plan the research',
    body: 'Turn an open question into an interview or test plan.',
    triggers: ['用户研究', 'user research', 'interview', '访谈'],
    downstream: ['design.synthesis'],
  },
  {
    id: 'design.synthesis',
    name: 'Synthesize findings',
    body: 'Cluster raw research into themes with evidence attached.',
    triggers: ['synthesis', '研究结论', 'what did we learn'],
    downstream: ['design.brief'],
  },
  {
    id: 'design.competitive',
    name: 'Take apart a competitor',
    body: 'Describe how another product solves this, and at what cost.',
    triggers: ['竞品', 'competitor', 'how does x do it'],
    downstream: ['design.brief'],
  },
  {
    id: 'design.tickets',
    name: 'Mine support tickets',
    body: 'Find the recurring complaint under a pile of individual reports.',
    triggers: ['工单', 'support tickets', 'complaints'],
    downstream: ['design.synthesis'],
  },
  {
    id: 'design.brief',
    name: 'Write the design brief',
    body: 'One page: problem, audience, constraints, what success looks like.',
    triggers: ['设计简报', 'design brief', 'one pager'],
    downstream: ['design.stories', 'design.ia'],
  },
  {
    id: 'design.stories',
    name: 'Break into stories',
    body: 'Decompose the brief into user-visible slices.',
    triggers: ['用户故事', 'user stories', 'break it down'],
    downstream: ['design.flows'],
  },
  {
    id: 'design.ia',
    name: 'Information architecture',
    body: 'Decide what lives where, and what the names are.',
    triggers: ['信息架构', 'sitemap', 'ia', '站点地图'],
    downstream: ['design.flows'],
  },
  {
    id: 'design.flows',
    name: 'Draw the flows',
    body: 'Screen-by-screen path for each story, including entry points.',
    triggers: ['flow', '流程', 'user journey', '用户旅程'],
    downstream: ['design.states', 'design.visual'],
  },
  {
    id: 'design.states',
    name: 'Enumerate the states',
    body: 'Empty, loading, error, partial, offline, denied, and over-limit.',
    triggers: ['异常态', 'edge cases', 'empty state', 'error state'],
    downstream: ['design.visual'],
  },
  {
    id: 'design.visual',
    name: 'Set the visual direction',
    body: 'Type scale, spacing, colour roles, and what they are derived from.',
    triggers: ['视觉', 'visual direction', 'mood board', 'design tokens'],
    downstream: ['design.motion', 'design.a11y'],
  },
  {
    id: 'design.motion',
    name: 'Plan the motion',
    body: 'Which transitions carry meaning, and which are decoration to cut.',
    triggers: ['动效', 'motion', 'animation', 'transition'],
    downstream: ['design.handoff'],
  },
  {
    id: 'design.a11y',
    name: 'Accessibility audit',
    body: 'Contrast, target size, focus order, and what a screen reader hears.',
    triggers: ['无障碍', 'accessibility', 'a11y', 'wcag', 'contrast'],
    downstream: ['design.handoff'],
  },
  {
    id: 'design.usability',
    name: 'Run a usability test',
    body: 'Tasks, success criteria, and what counts as a failure.',
    triggers: ['可用性测试', 'usability test', 'user testing'],
    downstream: ['design.retro'],
  },
  {
    id: 'design.metrics',
    name: 'Define the metrics',
    body: 'What to instrument, and what number would mean this worked.',
    triggers: ['度量', 'metrics', 'instrumentation', '埋点'],
    downstream: ['design.handoff'],
  },
  {
    id: 'design.handoff',
    name: 'Engineering handoff',
    body: 'Layout rules, tokens, component states, and the edge cases to build.',
    triggers: ['交付', 'handoff', 'spec for engineering', '给开发'],
  },
  {
    id: 'design.retro',
    name: 'Design retrospective',
    body: 'What the shipped thing taught us, with evidence.',
    triggers: ['设计复盘', 'retrospective', 'post mortem', '复盘'],
  },
]

export interface ExampleKit {
  id: string
  name: string
  /** Who this is for. A kit with no stated audience gets used by nobody. */
  audience: readonly string[]
  skills: readonly ExpertSkill[]
}

export const EXAMPLE_KITS: readonly ExampleKit[] = [
  {
    id: 'example.code-review',
    name: 'Code review',
    audience: ['reviewer', 'tech lead'],
    skills: EXAMPLE_CODE_REVIEW_KIT,
  },
  {
    id: 'example.product-design',
    name: 'Product design',
    audience: ['product designer', 'UX designer', 'design lead'],
    skills: EXAMPLE_PRODUCT_DESIGN_KIT,
  },
]
