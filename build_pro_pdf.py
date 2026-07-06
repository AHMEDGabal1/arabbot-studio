import os
import sys
import re
from pathlib import Path
from markdown_pdf import MarkdownPdf, Section

CSS_STYLE = """
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #24292e;
    line-height: 1.6;
    font-size: 14px;
    background-color: #ffffff;
}
h1 {
    color: #24292e;
    border-bottom: 2px solid #eaecef;
    padding-bottom: 8px;
    margin-top: 30px;
    font-size: 28px;
}
h2 {
    color: #24292e;
    border-bottom: 1px solid #eaecef;
    padding-bottom: 5px;
    margin-top: 25px;
    font-size: 22px;
}
h3 {
    color: #24292e;
    margin-top: 20px;
    font-size: 18px;
}
a {
    color: #0366d6;
    text-decoration: none;
}
code {
    background-color: #f6f8fa;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 85%;
    color: #24292e;
}
pre {
    background-color: #f6f8fa;
    color: #24292e;
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
}
pre code {
    background-color: transparent;
    padding: 0;
    font-size: 100%;
}
blockquote {
    border-left: 4px solid #dfe2e5;
    padding-left: 15px;
    margin-left: 0;
    color: #6a737d;
    background-color: transparent;
}
table {
    border-collapse: collapse;
    width: 100%;
    margin: 20px 0;
}
th, td {
    border: 1px solid #dfe2e5;
    padding: 6px 13px;
    text-align: left;
}
th {
    background-color: #f6f8fa;
    color: #24292e;
    font-weight: 600;
}
tr:nth-child(even) {
    background-color: #f6f8fa;
}
hr {
    border: 0;
    border-top: 1px solid #eaecef;
    margin: 30px 0;
}
"""

def generate_pdf():
    root = Path(__file__).resolve().parent
    
    pdf = MarkdownPdf(toc_level=2)
    
    # Set the CSS style for all sections (we inject it into the first one, or we can just append a style tag to the markdown)
    style_tag = f"<style>\n{CSS_STYLE}\n</style>\n\n"
    
    # 1. Title Page
    title_content = """
<div style="text-align: center; margin-top: 150px;">
    <h1 style="border: none; font-size: 48px; color: #24292e; margin-bottom: 10px;">ArabBot Studio</h1>
    <h2 style="border: none; font-size: 24px; color: #6a737d; margin-top: 0;">Technical Documentation Manual</h2>
    <p style="margin-top: 50px; font-size: 16px; color: #0366d6;"><i>Version 1.0 - July 2026</i></p>
</div>
"""
    pdf.add_section(Section(style_tag + title_content, toc=False))
    
    def preprocess(text):
        if text.startswith('---'):
            text = re.sub(r'^---[\s\S]*?---\n', '', text, count=1)
        text = text.replace('```mermaid', '```text')
        text = re.sub(r'<p align="center">[\s\S]*?</p>', '', text)
        return text.strip()
    
    # 2. Product Overview
    readme = root / "README.md"
    if readme.exists():
        content = preprocess(readme.read_text(encoding="utf-8"))
        pdf.add_section(Section(f"# Chapter 1: Product Overview\n\n{content}"))
        
    # 3. Design System
    design = root / "DESIGN.md"
    if design.exists():
        content = preprocess(design.read_text(encoding="utf-8"))
        pdf.add_section(Section(f"# Chapter 2: The Amber Studio Design System\n\n{content}"))
        
    # 4. Agent Guidelines
    agents = root / "AGENTS.md"
    if agents.exists():
        content = preprocess(agents.read_text(encoding="utf-8"))
        pdf.add_section(Section(f"# Chapter 3: Developer & Agent Guidelines\n\n{content}"))
        
    # 5. Architecture Decision Records
    decisions_dir = root / "docs" / "decisions"
    if decisions_dir.exists():
        adrs = sorted(decisions_dir.glob("*.md"))
        adr_content = "# Chapter 4: Architecture Decision Records (ADRs)\n\n"
        adr_content += "The following are the formal decisions detailing the 'why' behind the project's technical stack.\n\n"
        for p in adrs:
            adr_content += f"\n\n---\n\n{preprocess(p.read_text(encoding='utf-8'))}"
        pdf.add_section(Section(adr_content))

    output_path = root / "ArabBot_Studio_Technical_Manual.pdf"
    pdf.save(str(output_path))
    print(f"Successfully generated {output_path.name}")

if __name__ == "__main__":
    generate_pdf()
