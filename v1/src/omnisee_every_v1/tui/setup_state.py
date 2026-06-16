"""Setup state logic for SetupModal in the TUI app."""
from __future__ import annotations

from dataclasses import dataclass, field
from omnisee_every_v1.tui.model_meta import model_has_vision, canonical_provider_url
from omnisee_every_v1.tui import model_fetcher


@dataclass
class SetupState:
    step: str = "provider"
    reason: str = ""
    pid: str = ""
    protocol: str = "openai"
    key: str = ""
    url: str = ""
    model: str = ""
    has_vision: bool = False
    model_options: list[tuple[str, str, str]] = field(default_factory=list)

    # Internal state properties
    _fetch_attempted: bool = False
    _fetch_used_fallback: bool = False
    _fetch_error: str = ""
    _orig_key: str = ""
    _orig_url: str = ""
    _orig_model: str = ""
    _orig_pid: str = ""
    _model_search_query: str = ""

    def select_provider(self, new_pid: str, providers: dict[str, dict], cfg: dict) -> None:
        """Select a new provider and initialize default values."""
        if new_pid == self._orig_pid:
            self.pid = new_pid
            self.url = canonical_provider_url(new_pid, providers, self._orig_url)
            self.key = self._orig_key
            self.model = self._orig_model
            llm = cfg.get("llm") or {}
            if not isinstance(llm, dict):
                llm = {}
            self.protocol = llm.get("protocol") or providers.get(new_pid, {}).get("protocol", "openai")
        else:
            self.pid = new_pid
            self.url = providers.get(new_pid, {}).get("url", "")
            self.key = ""
            self.model = ""
            self.protocol = providers.get(new_pid, {}).get("protocol", "openai")

        self.model_options = list(providers.get(self.pid, {}).get("models", []))
        if self.model and not any(m[0] == self.model for m in self.model_options):
            tag, desc = model_fetcher.annotate_model(self.model)
            self.model_options.insert(0, (self.model, tag, desc))
        self.step = "key"

    def submit_key_and_url(self, key: str, url: str, providers: dict[str, dict]) -> bool:
        """Submit the current key and url. Returns True if valid and advanced, False if key is missing."""
        self.key = key.strip()
        self.url = url.strip()
        p = providers.get(self.pid)
        if p and p.get("need_key") and not self.key:
            return False
        self.step = "model"
        return True

    def set_protocol(self, protocol: str, key: str, url: str) -> None:
        """Update selected protocol and custom provider URL if custom."""
        self.key = key.strip()
        self.url = url.strip()
        self.protocol = "anthropic" if protocol == "anthropic" else "openai"
        if self.pid == "custom":
            if self.protocol == "anthropic" and not self.url:
                self.url = "https://api.anthropic.com"
            elif self.protocol == "openai" and self.url == "https://api.anthropic.com":
                self.url = ""


def resolve_setup_state(cfg: dict | None, providers: dict[str, dict], reason: str = "") -> SetupState:
    """Resolve the initial SetupState from config and available providers."""
    cfg = cfg or {}
    llm = _llm_from_cfg(cfg)
    key, url, model, cur_protocol = _current_llm_values(llm)
    pid = _matched_provider_id(llm, url, providers)

    return SetupState(
        step="provider",
        reason=reason,
        pid=pid,
        protocol=_initial_protocol(pid, cur_protocol, providers),
        key=key,
        url=_initial_url(pid, url, providers),
        model=model,
        has_vision=_initial_has_vision(llm, model),
        model_options=_initial_model_options(pid, model, providers),
        _fetch_attempted=False,
        _fetch_used_fallback=False,
        _fetch_error="",
        _orig_key=key,
        _orig_url=url,
        _orig_model=model,
        _orig_pid=pid,
        _model_search_query="",
    )


def _llm_from_cfg(cfg: dict) -> dict:
    llm = cfg.get("llm") or {}
    return llm if isinstance(llm, dict) else {}


def _current_llm_values(llm: dict) -> tuple[str, str, str, str]:
    return (
        (llm.get("api_key") or "").strip(),
        (llm.get("base_url") or "").strip(),
        (llm.get("model_name") or "").strip(),
        (llm.get("protocol") or "").strip(),
    )


def _matched_provider_id(llm: dict, cur_url: str, providers: dict[str, dict]) -> str:
    explicit_pid = (llm.get("provider") or llm.get("provider_id") or "").strip()
    if explicit_pid in providers:
        return explicit_pid
    if cur_url:
        return _provider_id_from_url(cur_url, providers) or "custom"
    return "deepseek"


def _provider_id_from_url(cur_url: str, providers: dict[str, dict]) -> str:
    norm_cur = _normalized_provider_url(cur_url)
    for pid, provider in providers.items():
        url = provider.get("url")
        if url and (_normalized_provider_url(url) == norm_cur or norm_cur == pid):
            return pid
    return ""


def _normalized_provider_url(url: str) -> str:
    normalized = url.strip().lower().rstrip("/")
    if normalized.endswith("/v1"):
        normalized = normalized[:-3].rstrip("/")
    if "generativelanguage.googleapis.com" in normalized:
        return "gemini"
    if "ark.cn-beijing.volces.com" in normalized:
        return "doubao"
    return normalized


def _initial_protocol(pid: str, cur_protocol: str, providers: dict[str, dict]) -> str:
    provider_protocol = providers.get(pid, {}).get("protocol", "openai")
    return cur_protocol or provider_protocol or "openai"


def _initial_url(pid: str, cur_url: str, providers: dict[str, dict]) -> str:
    if pid and pid != "custom":
        return canonical_provider_url(pid, providers, cur_url)
    return cur_url


def _initial_model_options(
    pid: str,
    model: str,
    providers: dict[str, dict],
) -> list[tuple[str, str, str]]:
    if not pid or pid not in providers:
        return []
    model_options = list(providers[pid].get("models", []))
    if model and not any(entry[0] == model for entry in model_options):
        tag, desc = model_fetcher.annotate_model(model)
        model_options.insert(0, (model, tag, desc))
    return model_options


def _initial_has_vision(llm: dict, model: str) -> bool:
    if "has_vision" in llm:
        return bool(llm.get("has_vision"))
    return model_has_vision(model)
