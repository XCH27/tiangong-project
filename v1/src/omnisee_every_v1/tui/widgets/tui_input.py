"""TUIInput widget and its clipboard-media key handling helper."""

from __future__ import annotations
from textual import events
from textual.widgets import Input
from omnisee_every_v1.tui.clipboard_utils import clipboard_has_media as _probe_clipboard_has_media


class TUIInput(Input):
    """A custom Input widget that intercepts config / paste shortcuts.

    Unlike before, ctrl+v is ONLY redirected to media-paste when the clipboard
    actually contains media or a media URL. For plain text on the clipboard we
    let the parent Input handle the paste normally — otherwise normal text
    paste gets silently swallowed.
    """
    BINDINGS = [b for b in Input.BINDINGS if b.key not in ("f1", "ctrl+k", "ctrl+s")]

    async def _on_key(self, event: events.Key) -> None:
        if event.key in ("f1", "ctrl+k", "ctrl+s"):
            event.stop()
            try:
                self.screen.action_open_setup()
            except Exception:
                pass
            return
        elif event.key in ("ctrl+v", "super+v", "cmd+v"):
            # Only intercept ctrl+v / super+v if clipboard contains media or a media URL.
            # Otherwise fall through to normal text paste so the user's text
            # paste actually works.
            if _clipboard_has_media():
                event.stop()
                try:
                    self.screen.action_paste_media()
                except Exception:
                    pass
                return
            # else: let Input do its normal text paste
        await super()._on_key(event)


def _clipboard_has_media() -> bool:
    return _probe_clipboard_has_media()
