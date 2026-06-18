from pathlib import Path
import re

try:
    import fitz
except ImportError as error:
    raise SystemExit(
        "PyMuPDF is required. Install it with `python -m pip install pymupdf`."
    ) from error


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PDF = ROOT / "Module ID & Tranche Breakdown - Overall & By Level.pdf"
OUTPUT = ROOT / "data" / "module-coordinates.ts"
MODULE_ID = re.compile(r"^M\d+$")


def normalized_module_id(level: int, module_id: str, x: float, y: float) -> str:
    # The level 6 PDF text layer drops one digit for M211.
    if level == 6 and module_id == "M21" and 250 <= x <= 1300 and 250 <= y <= 500:
        return "M211"

    return module_id


def is_plan_region(x: float, y: float) -> bool:
    # Excludes sheet title block, legend, and external callout labels while keeping
    # the actual plan clusters on pages 2-8.
    return 600 <= x <= 1900 and 100 <= y <= 1950


def extract_coordinates() -> dict[str, dict[str, float | int]]:
    if not SOURCE_PDF.exists():
        raise SystemExit(f"Missing source PDF: {SOURCE_PDF}")

    document = fitz.open(SOURCE_PDF)
    coordinates: dict[str, dict[str, float | int]] = {}

    for page_index in range(1, 8):
        level = page_index
        source_page = page_index + 1
        candidates: dict[str, tuple[float, float]] = {}

        for word in document[page_index].get_text("words"):
            x0, y0, x1, y1, text, *_ = word
            if not MODULE_ID.match(text):
                continue

            x = (x0 + x1) / 2
            y = (y0 + y1) / 2
            if not is_plan_region(x, y):
                continue

            module_id = normalized_module_id(level, text, x, y)

            # External callouts are generally farthest right; prefer the first
            # in-plan label after region filtering.
            candidates.setdefault(module_id, (x, y))

        for module_id, (x, y) in candidates.items():
            coordinates[module_id] = {
                "level": level,
                "sourcePage": source_page,
                "sheetX": round(x, 1),
                "sheetY": round(y, 1),
            }

    return coordinates


def emit_typescript(coordinates: dict[str, dict[str, float | int]]) -> None:
    lines = [
        "export type ModuleCoordinate = {",
        "  level: number;",
        "  sourcePage: number;",
        "  sheetX: number;",
        "  sheetY: number;",
        "};",
        "",
        "export const moduleCoordinates: Record<string, ModuleCoordinate> = {",
    ]

    def sort_key(item: tuple[str, dict[str, float | int]]) -> tuple[int, int]:
        module_id, coordinate = item
        return (int(coordinate["level"]), int(module_id[1:]))

    for module_id, coordinate in sorted(coordinates.items(), key=sort_key):
        lines.append(
            f'  "{module_id}": {{ level: {coordinate["level"]}, '
            f'sourcePage: {coordinate["sourcePage"]}, '
            f'sheetX: {coordinate["sheetX"]}, sheetY: {coordinate["sheetY"]} }},'
        )

    lines.extend(["};", ""])
    OUTPUT.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    coordinates = extract_coordinates()
    emit_typescript(coordinates)
    print(f"Wrote {len(coordinates)} module coordinates to {OUTPUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
