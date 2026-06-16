"""VisionToggle — custom toggle widget to represent VLM capability."""

from __future__ import annotations
from textual.widgets import Static


class VisionToggle(Static):
    """A custom clickable toggle to represent if the main dialogue LLM has vision capability."""

    def __init__(self, value: bool) -> None:
        super().__init__("", id="vision-toggle")
        self.value = value
        self._update_label()

    def _update_label(self) -> None:
        box = (
            "▧ [bold]主模型具备看图能力 (Main Model has vision capability)[/]"
            if self.value
            else "▢ [dim]主模型仅支持纯文本 (Main Model is text-only)[/]"
        )
        self.update(box)

    def on_click(self) -> None:
        self.value = not self.value
        self._update_label()
