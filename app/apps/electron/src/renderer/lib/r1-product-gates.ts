/**
 * R1 product gates — UI exposure only. Do not delete backends these hide.
 *
 * Flip or remove gates when the owning release lands (see docs/05-ROADMAP.md and
 * docs/specs/R1-one-boundary-language.md Explicit donor table).
 *
 * | Gate | R1 product | Later consumer |
 * |------|------------|----------------|
 * | nested projectId session-menu write | hidden (no new writes) | migration / folder-bind UX |
 * | nested projectId Session-list filter | hidden (Project = Workspace) | migration / asset-index UX |
 * | nested projects navigator list | redirect / hint only | optional asset index if still needed |
 * | app appearance per-workspace theme UI | removed; API kept | never re-expose as "project theme" |
 * | kanban appearance settings | hidden | Board product surface if owner re-opens |
 * | Board default nav | not linked from shell | R task-center (not Kanban clone) |
 * | cloud/remote project create | exposed through existing connection path | R14 hardening |
 *
 * Soft-focus rule (R1 §3 / Decisions P6): local Project row filters the Session
 * list only — does **not** switch Sources, Skills, or settings authority.
 * Settings always edit the shell-active Workspace (implementation Project).
 */

/** Hide nested v0.11 projectId assignment in Session menus (R1: no new writes). */
export const R1_HIDE_NESTED_PROJECT_ID_UI = true

/** Hide nested v0.11 projectId filtering in the Session-list menu. */
export const R1_HIDE_NESTED_PROJECT_FILTER_UI = true
