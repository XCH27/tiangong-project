import { ansiFg, ansiReset, getTheme } from "../theme/theme.js";
import { fitLines, panelTitle } from "./ShellLayout.js";
export function renderRail(state, region) {
    const t = getTheme(state.theme);
    const screenLabel = {
        home: "Analyze",
        chat: "Assets",
        setup: "Setup",
        protocol: "Protocol",
    };
    const stages = ["input", "plan", "run", "done", "fallback"];
    const lines = [
        panelTitle(state.theme, " OmniVerse"),
        "",
        `${ansiFg(t.text_l4)}Mode${ansiReset}`,
        `${ansiFg(t.text_l1)}${screenLabel[state.activeScreen]}${ansiReset}`,
        "",
        `${ansiFg(t.text_l4)}Pipeline${ansiReset}`,
        ...stages.map((stage) => `${stage === state.stage ? ansiFg(t.accent) + "●" : ansiFg(t.text_l4) + "○"} ${stage}${ansiReset}`),
        "",
        `${ansiFg(t.text_l4)}Skill${ansiReset}`,
        `${ansiFg(t.text_l1)}${state.skillName}${ansiReset}`,
        "",
        `${ansiFg(t.text_l4)}Surfaces${ansiReset}`,
        "Analysis",
        "Assets",
        "Setup",
        "Protocol",
    ];
    return fitLines(lines, region);
}
