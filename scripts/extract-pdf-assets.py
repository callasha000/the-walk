from pathlib import Path
import sys

try:
    import fitz
except ImportError:
    print(
        "PyMuPDF is required. Install it with `python -m pip install pymupdf` "
        "or run this script with the Codex bundled Python runtime.",
        file=sys.stderr,
    )
    raise


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PDF = ROOT / "Module ID & Tranche Breakdown - Overall & By Level.pdf"
OUTPUT_DIR = ROOT / "public" / "generated" / "pdf-pages"
PAGE_NAMES = ["module-id-overall.png"] + [
    f"module-id-level-{level}.png" for level in range(1, 8)
]


def main() -> int:
    if not SOURCE_PDF.exists():
        print(f"Missing source PDF: {SOURCE_PDF}", file=sys.stderr)
        return 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    document = fitz.open(SOURCE_PDF)
    if len(document) < len(PAGE_NAMES):
        print(
            f"Expected at least {len(PAGE_NAMES)} pages, found {len(document)}.",
            file=sys.stderr,
        )
        return 1

    for page_index, filename in enumerate(PAGE_NAMES):
        page = document[page_index]
        pixmap = page.get_pixmap(matrix=fitz.Matrix(0.5, 0.5), alpha=False)
        output_path = OUTPUT_DIR / filename
        pixmap.save(output_path)
        print(output_path.relative_to(ROOT))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
