"""
PDF Generator for ArabBot Studio documentation.

Generates a professional PDF from README.md with proper typography,
language support (Arabic + English), table layout, and code blocks.
"""
from __future__ import annotations

import logging
import platform
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator

import arabic_reshaper
from bidi.algorithm import get_display
from fpdf import FPDF

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("pdfgen")

README = Path(__file__).resolve().parent / "README.md"
OUTPUT = Path(__file__).resolve().parent / "docs.pdf"


# ---------------------------------------------------------------------------
# Arabic text reshaping (RTL support)
# ---------------------------------------------------------------------------

def reshape_text(text: str) -> str:
    """Reshape Arabic text for proper RTL rendering in PDF."""
    if not re.search(r"[\u0600-\u06FF]", text):
        return text
    try:
        return get_display(arabic_reshaper.reshape(text))
    except Exception:
        return text


# ---------------------------------------------------------------------------
# Font discovery
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class FontPaths:
    """Resolved TrueType font paths for the current platform."""

    regular: str
    bold: str
    italic: str
    bold_italic: str
    mono: str | None


def _resolve_fonts() -> FontPaths:
    system = platform.system()

    if system == "Windows":
        base = "C:\\Windows\\Fonts\\"
        return FontPaths(
            regular=_require_font(base + "arial.ttf"),
            bold=_require_font(base + "arialbd.ttf"),
            italic=_require_font(base + "ariali.ttf"),
            bold_italic=_require_font(base + "arialbi.ttf"),
            mono=base + "consola.ttf" if Path(base + "consola.ttf").exists() else None,
        )

    if system == "Darwin":
        base = "/System/Library/Fonts/"
        return FontPaths(
            regular=_require_font(base + "Helvetica.ttc"),
            bold=_require_font(base + "HelveticaBold.ttf"),
            italic=_require_font(base + "HelveticaLight.ttf"),
            bold_italic=_require_font(base + "HelveticaBold.ttf"),
            mono="/System/Library/Fonts/Menlo.ttc" if Path("/System/Library/Fonts/Menlo.ttc").exists() else None,
        )

    # Linux fallback — DejaVu is almost always available
    for base in ["/usr/share/fonts/truetype/dejavu/", "/usr/share/fonts/truetype/liberation/"]:
        regular = Path(base + "DejaVuSans.ttf")
        mono = Path(base + "DejaVuSansMono.ttf")
        if regular.exists():
            return FontPaths(
                regular=str(regular),
                bold=str(base + "DejaVuSans-Bold.ttf"),
                italic=str(base + "DejaVuSans-Oblique.ttf"),
                bold_italic=str(base + "DejaVuSans-BoldOblique.ttf"),
                mono=str(mono) if mono.exists() else None,
            )
    msg = "No suitable Unicode font found. Install DejaVu Sans or Liberation Sans."
    raise RuntimeError(msg)


def _require_font(path: str) -> str:
    if not Path(path).exists():
        log.warning("Font not found: %s — bold/italic may fall back", path)
    return path


# ---------------------------------------------------------------------------
# Markdown tokeniser (lightweight, yields structured tokens)
# ---------------------------------------------------------------------------

@dataclass
class Heading:
    level: int
    text: str


@dataclass
class CodeBlock:
    language: str
    content: str


@dataclass
class TableRow:
    cells: list[str]


@dataclass
class Bullet:
    text: str


@dataclass
class BodyText:
    text: str


@dataclass
class Separator:
    pass


@dataclass
class BlankLine:
    pass


Token = Heading | CodeBlock | TableRow | Bullet | BodyText | Separator | BlankLine


def _preprocess_line(raw: str) -> str:
    return reshape_text(strip_emoji(raw))


def strip_emoji(text: str) -> str:
    return re.sub(r"[^\u0000-\uFFFF\n]", "", text)


def tokenise(text: str) -> Iterator[Token]:
    """Yield structured tokens from markdown text."""
    text = strip_emoji(text)

    lines = text.split("\n")
    i = 0
    while i < len(lines):
        raw = lines[i]

        # Skip HTML tags (badges, formatting from README header)
        if raw.strip().startswith("<"):
            i += 1
            continue

        # Heading  (1-3 #)
        m = re.match(r"^(#{1,3})\s+(.+)$", raw)
        if m:
            yield Heading(level=len(m.group(1)), text=reshape_text(m.group(2).strip()))
            i += 1
            continue

        # Fenced code block  (``` or ```mermaid etc.)
        if raw.strip().startswith("```"):
            fence_info = raw.strip()[3:].strip()
            buff: list[str] = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                buff.append(lines[i])
                i += 1
            language = fence_info.split()[0] if fence_info else ""
            # Mermaid diagrams are not renderable — emit empty block
            content = "\n".join(buff) if language != "mermaid" else ""
            yield CodeBlock(language=language, content=content)
            i += 1
            continue

        # Table row  (| a | b | c |)
        if raw.strip().startswith("|") and raw.strip().endswith("|"):
            cells = [reshape_text(c.strip()) for c in raw.strip().strip("|").split("|")]
            if not all(re.match(r"^[-:]+\s*$", c) for c in cells):
                yield TableRow(cells=cells)
            i += 1
            continue

        # Horizontal rule
        if re.match(r"^---+\s*$", raw.strip()):
            yield Separator()
            i += 1
            continue

        # Bullet
        if raw.strip().startswith("- "):
            yield Bullet(text=reshape_text(raw.strip()[2:]))
            i += 1
            continue

        # Blank line
        if raw.strip() == "":
            yield BlankLine()
            i += 1
            continue

        # Regular body text (strip bold markers for PDF rendering)
        if raw.strip():
            yield BodyText(text=reshape_text(re.sub(r"\*\*", "", raw.strip())))
        i += 1


# ---------------------------------------------------------------------------
# PDF builder
# ---------------------------------------------------------------------------

# Design tokens
NAVY = (26, 31, 46)
DARK_BLUE = (42, 48, 80)
MID_BLUE = (74, 80, 120)
BODY = (40, 40, 40)
MUTED = (100, 100, 100)
DIM = (150, 150, 150)
CODE_BG = (245, 237, 230)
TABLE_ALT = (250, 245, 240)
TABLE_HEADER_BG = (42, 48, 80)
WHITE = (255, 255, 255)


class DocPDF(FPDF):

    def __init__(self, fonts: FontPaths) -> None:
        super().__init__()
        self._fonts = fonts
        self._register()
        self.alias_nb_pages()
        self.set_auto_page_break(auto=True, margin=20)

    # -- font registration ------------------------------------------------

    def _register(self) -> None:
        f = self._fonts
        self.add_font("Sans", "", f.regular)
        self.add_font("Sans", "B", f.bold)
        self.add_font("Sans", "I", f.italic)
        self.add_font("Sans", "BI", f.bold_italic)
        if f.mono:
            self.add_font("Mono", "", f.mono)

    # -- page ornament ----------------------------------------------------

    def header(self) -> None:
        if self.page_no() <= 1:
            return
        self.set_font("Sans", "I", 8)
        self.set_text_color(*DIM)
        self.cell(0, 8, "ArabBot Studio \u2014 Documentation", align="C")
        self.ln(10)

    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("Sans", "I", 8)
        self.set_text_color(*DIM)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    # -- content methods --------------------------------------------------

    def title_page(self) -> None:
        self.add_page()
        self.set_font("Sans", "B", 24)
        self.set_text_color(*NAVY)
        self.ln(50)
        self.cell(0, 12, "ArabBot Studio", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Sans", "", 12)
        self.set_text_color(*MUTED)
        self.cell(0, 8, "AI Chatbot Platform for Egyptian SMBs", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Sans", "I", 9)
        self.set_text_color(*DIM)
        self.cell(0, 6, "WhatsApp Business \u00b7 Egyptian Arabic \u00b7 RAG Knowledge Base",
                  align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(30)
        self.set_font("Sans", "", 8)
        self.cell(0, 5, "Generated from README.md", align="C", new_x="LMARGIN", new_y="NEXT")

    def heading(self, text: str, level: int) -> None:
        sizes = {1: 18, 2: 13, 3: 10}
        colours = {1: NAVY, 2: DARK_BLUE, 3: MID_BLUE}
        gaps = {1: 6, 2: 5, 3: 3}
        self.set_font("Sans", "B", sizes.get(level, 10))
        self.set_text_color(*colours.get(level, BODY))
        self.ln(gaps.get(level, 3))
        self.multi_cell(0, 6, text)
        self.ln(2)

    def body(self, text: str) -> None:
        self.set_font("Sans", "", 9)
        self.set_text_color(*BODY)
        self.multi_cell(0, 4.5, text)
        self.ln(1)

    def bullet(self, text: str) -> None:
        self.set_font("Sans", "", 9)
        self.set_text_color(*BODY)
        x0 = self.get_x()
        self.cell(4, 5, "\u2022")
        self.multi_cell(0, 5, text)
        self.ln(1)

    def code_block(self, text: str) -> None:
        if not text.strip():
            return
        # Use Mono if available and text contains no Arabic, else fallback to Sans
        has_arabic = bool(re.search(r"[\u0600-\u06FF]", text))
        font_name = "Mono" if (self._fonts.mono and not has_arabic) else "Sans"
        self.set_font(font_name, "", 6.5 if font_name == "Mono" else 8)
        self.set_fill_color(*CODE_BG)
        self.set_text_color(*NAVY)
        self.ln(1)
        for line in text.strip().split("\n"):
            self.cell(0, 4, f"  {line}", fill=True, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def table_header(self, cells: list[str]) -> None:
        w = self._col_width(len(cells))
        self.set_font("Sans", "B", 7)
        self.set_fill_color(*TABLE_HEADER_BG)
        self.set_text_color(*WHITE)
        for c in cells:
            self.cell(w, 6, c[:35], border=1, fill=True, align="C")
        self.ln()

    def table_row(self, cells: list[str], fill: bool = False) -> None:
        w = self._col_width(len(cells))
        self.set_font("Sans", "", 6.5)
        self.set_text_color(*BODY)
        if fill:
            self.set_fill_color(*TABLE_ALT)
        for c in cells:
            self.cell(w, 5, c[:30], border=1, fill=fill, align="L")
        self.ln()

    def render_table(self, rows: list[list[str]]) -> None:
        if not rows:
            return
        self.table_header(rows[0])
        for j, row in enumerate(rows[1:], start=1):
            self.table_row(row, fill=(j % 2 == 0))
        self.ln(3)

    def _col_width(self, n: int) -> int:
        return max(15, int((self.w - 20) / n))


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    log.info("Resolving fonts for %s ...", platform.system())
    fonts = _resolve_fonts()

    log.info("Reading %s ...", README.name)
    source = README.read_text(encoding="utf-8")

    log.info("Building PDF ...")
    pdf = DocPDF(fonts)
    pdf.title_page()

    table_buffer: list[list[str]] = []

    def flush_table():
        nonlocal table_buffer
        if table_buffer:
            pdf.render_table(table_buffer)
            table_buffer = []

    for token in tokenise(source):
        if isinstance(token, Separator):
            flush_table()
        elif isinstance(token, BlankLine):
            flush_table()
        elif isinstance(token, TableRow):
            table_buffer.append(token.cells)
        elif isinstance(token, Heading):
            flush_table()
            pdf.heading(token.text, token.level)
        elif isinstance(token, CodeBlock):
            flush_table()
            pdf.code_block(token.content)
        elif isinstance(token, Bullet):
            flush_table()
            pdf.bullet(token.text)
        elif isinstance(token, BodyText):
            flush_table()
            pdf.body(token.text)

    flush_table()
    pdf.output(str(OUTPUT))
    log.info("Done \u2014 %s (%d bytes)", OUTPUT.name, OUTPUT.stat().st_size)


if __name__ == "__main__":
    main()
