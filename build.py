#!/usr/bin/env python3
"""Bundle the Finance Bro AI demo into one self-contained page.

Usage:
    python3 build.py            # writes dist/index.html (artifact) and docs/index.html (GitHub Pages)
    python3 build.py --watch    # rebuilds whenever a file in src/ changes

No installs needed. React and Babel load from cdnjs at runtime, so the page
needs an internet connection the first time it opens.
"""
import base64
import pathlib
import json
import sys
import time

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
DIST = ROOT / "dist"
DOCS = ROOT / "docs"

# Order matters: later files use names defined in earlier ones.
SCRIPTS = [
    "data.js",
    "engine.js",
    "ui.jsx",
    "charts.jsx",
    "screens/setup.jsx",
    "screens/home.jsx",
    "screens/analysis.jsx",
    "screens/scenarios.jsx",
    "screens/validate.jsx",
    "app.jsx",
]


def build() -> pathlib.Path:
    template = (SRC / "index.template.html").read_text()
    css = (SRC / "styles.css").read_text()
    js = "\n\n".join(
        f"// ---- {name} ----\n" + (SRC / name).read_text() for name in SCRIPTS
    )
    if "</script" in js:
        raise SystemExit("A source file contains '</script' — escape it before bundling.")
    illustrations = {
        name: "data:image/png;base64," + base64.b64encode((SRC / "assets" / f"{name}.png").read_bytes()).decode()
        for name in ("clarity", "scenarios", "planning")
    }
    assets = "const ILLUSTRATIONS = " + json.dumps(illustrations) + ";"
    html = template.replace("/*__CSS__*/", css).replace("//__ASSETS__", assets).replace("//__JS__", js)

    # dist/index.html: page content only (the claude.ai artifact host adds <html>/<head>/<body>).
    DIST.mkdir(exist_ok=True)
    out = DIST / "index.html"
    out.write_text(html)

    # docs/index.html: a complete document for GitHub Pages and opening the file directly.
    head, body = html.split('<div id="root">', 1)
    full = (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n" + head + "</head>\n<body>\n"
        + '<div id="root">' + body + "</body>\n</html>\n"
    )
    DOCS.mkdir(exist_ok=True)
    (DOCS / "index.html").write_text(full)
    (DOCS / ".nojekyll").write_text("")
    return out


def snapshot():
    return {p: p.stat().st_mtime for p in SRC.rglob("*") if p.is_file()}


if __name__ == "__main__":
    out = build()
    print(f"Built {out.relative_to(ROOT)}")
    if "--watch" in sys.argv:
        seen = snapshot()
        print("Watching src/ for changes (Ctrl+C to stop)…")
        while True:
            time.sleep(0.5)
            now = snapshot()
            if now != seen:
                seen = now
                try:
                    build()
                    print(time.strftime("%H:%M:%S"), "rebuilt")
                except SystemExit as e:
                    print(e)
