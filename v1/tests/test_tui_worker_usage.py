from __future__ import annotations

import ast
from pathlib import Path


def test_chat_screen_does_not_decorate_local_functions_with_work():
    """Textual @work expects a bound DOMNode method, not a no-arg local function."""
    path = Path("v1/omnisee_every_v1/tui/screens/chat.py")
    if not path.exists():
        path = Path("src/omnisee_every_v1/tui/screens/chat.py")
    source = path.read_text(encoding="utf-8")
    tree = ast.parse(source)

    parent: dict[ast.AST, ast.AST] = {}
    for node in ast.walk(tree):
        for child in ast.iter_child_nodes(node):
            parent[child] = node

    offenders: list[str] = []
    for node in ast.walk(tree):
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        if not any(_is_work_decorator(decorator) for decorator in node.decorator_list):
            continue
        if isinstance(parent.get(node), (ast.FunctionDef, ast.AsyncFunctionDef)):
            offenders.append(node.name)

    assert offenders == []


def _is_work_decorator(node: ast.AST) -> bool:
    if isinstance(node, ast.Name):
        return node.id == "work"
    if isinstance(node, ast.Call):
        return _is_work_decorator(node.func)
    return False
