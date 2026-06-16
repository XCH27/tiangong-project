"""Smoke test for the extracted SetupModal screen."""

from __future__ import annotations
import pytest

# Import app first to resolve pre-existing circular dependencies during test collection
import omnisee_every_v1.tui.app as _app

from textual.app import App
from omnisee_every_v1.tui.screens.setup import SetupModal


def test_setup_modal_instantiation() -> None:
    """Verify that SetupModal can be instantiated with basic config."""
    modal = SetupModal(reason="Initial Setup", cfg={})
    assert modal.CSS is not None
    assert any(b.key == "escape" for b in modal.BINDINGS)


@pytest.mark.asyncio
async def test_setup_modal_compose_and_mount() -> None:
    """Verify that SetupModal composes and mounts expected widgets."""
    modal = SetupModal(reason="Initial Setup", cfg={})

    class TestApp(App):
        def on_mount(self) -> None:
            self.push_screen(modal)

    async with TestApp().run_test(size=(80, 30)) as pilot:
        await pilot.pause()
        assert modal.query_one("#mbox") is not None
        assert modal.query_one("#crumb") is not None
        assert modal.query_one("#title") is not None
        assert modal.query_one("#btn-lang") is not None
        assert modal.query_one("#title-esc") is not None
        assert modal.query_one("#reason") is not None
        assert modal.query_one("#content") is not None
