from pathlib import Path
import re
from dataclasses import dataclass

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
EXPECTED_MODULE_COUNT = 499


@dataclass(frozen=True)
class ModuleRect:
    x_min: float
    y_min: float
    x_max: float
    y_max: float

    @property
    def width(self) -> float:
        return self.x_max - self.x_min

    @property
    def height(self) -> float:
        return self.y_max - self.y_min

    @property
    def area(self) -> float:
        return self.width * self.height

    def contains(self, x: float, y: float, tolerance: float = 3) -> bool:
        return (
            self.x_min - tolerance <= x <= self.x_max + tolerance
            and self.y_min - tolerance <= y <= self.y_max + tolerance
        )


def normalized_module_id(level: int, module_id: str, x: float, y: float) -> str:
    # The level 6 PDF text layer drops one digit for M211.
    if level == 6 and module_id == "M21" and 250 <= x <= 1300 and 250 <= y <= 500:
        return "M211"

    return module_id


def is_plan_region(x: float, y: float) -> bool:
    # Excludes sheet title block, legend, and external callout labels while keeping
    # the actual plan clusters on pages 2-8.
    return 600 <= x <= 1950 and 80 <= y <= 1980


def is_black(color: tuple[float, float, float] | None) -> bool:
    return color is not None and all(channel < 0.08 for channel in color)


def outline_candidate(drawing: dict) -> ModuleRect | None:
    if drawing.get("type") != "s" or not is_black(drawing.get("color")):
        return None

    width = drawing.get("width") or 0
    if not 1 <= width <= 3:
        return None

    rect = drawing.get("rect")
    if not rect:
        return None

    candidate = ModuleRect(
        x_min=float(rect.x0),
        y_min=float(rect.y0),
        x_max=float(rect.x1),
        y_max=float(rect.y1),
    )

    if candidate.width < 25 or candidate.height < 25:
        return None

    if candidate.area < 1200 or candidate.area > 70000:
        return None

    if not (500 <= candidate.x_min <= 2100 and 50 <= candidate.y_min <= 2050):
        return None

    return candidate


def module_outline_candidates(page: fitz.Page) -> list[ModuleRect]:
    return [
        candidate
        for drawing in page.get_drawings()
        if (candidate := outline_candidate(drawing)) is not None
    ]


def infer_rect_from_boundary_lines(page: fitz.Page, x: float, y: float) -> ModuleRect | None:
    verticals: list[tuple[float, float, float]] = []
    horizontals: list[tuple[float, float, float]] = []

    for drawing in page.get_drawings():
        if not is_black(drawing.get("color")):
            continue

        width = drawing.get("width") or 0
        if not 1 <= width <= 3:
            continue

        for item in drawing.get("items", []):
            if item[0] != "l":
                continue

            start, end = item[1], item[2]
            x1, y1, x2, y2 = float(start.x), float(start.y), float(end.x), float(end.y)
            if abs(x1 - x2) < 0.8:
                y_min, y_max = sorted((y1, y2))
                if y_min - 2 <= y <= y_max + 2 and y_max - y_min > 35:
                    verticals.append((x1, y_min, y_max))
            elif abs(y1 - y2) < 0.8:
                x_min, x_max = sorted((x1, x2))
                if x_min - 2 <= x <= x_max + 2 and x_max - x_min > 15:
                    horizontals.append((y1, x_min, x_max))

    left = max((line_x for line_x, _, _ in verticals if line_x < x), default=None)
    right = min((line_x for line_x, _, _ in verticals if line_x > x), default=None)
    top = max((line_y for line_y, _, _ in horizontals if line_y < y), default=None)
    bottom = min((line_y for line_y, _, _ in horizontals if line_y > y), default=None)

    if left is None or right is None or top is None or bottom is None:
        return None

    candidate = ModuleRect(left, top, right, bottom)
    if candidate.width < 25 or candidate.height < 25 or candidate.area < 1200:
        return None

    return candidate


def outline_for_label(
    page: fitz.Page,
    candidates: list[ModuleRect],
    level: int,
    module_id: str,
    x: float,
    y: float,
) -> ModuleRect | None:
    matches = [candidate for candidate in candidates if candidate.contains(x, y)]
    if matches:
        return min(matches, key=lambda candidate: candidate.area)

    # The level 1 M1 cell has its boundary linework, but the PDF does not emit
    # the same closed stroked rectangle as adjacent modules.
    if level == 1 and module_id == "M1":
        return infer_rect_from_boundary_lines(page, x, y)

    return None


def extract_coordinates() -> dict[str, dict[str, float | int]]:
    if not SOURCE_PDF.exists():
        raise SystemExit(f"Missing source PDF: {SOURCE_PDF}")

    document = fitz.open(SOURCE_PDF)
    coordinates: dict[str, dict[str, float | int]] = {}

    for page_index in range(1, 8):
        level = page_index
        source_page = page_index + 1
        page = document[page_index]
        candidates: dict[str, tuple[float, float]] = {}
        outline_candidates = module_outline_candidates(page)

        for word in page.get_text("words"):
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
            outline = outline_for_label(
                page=page,
                candidates=outline_candidates,
                level=level,
                module_id=module_id,
                x=x,
                y=y,
            )
            if outline is None:
                raise SystemExit(
                    f"Could not find PDF outline rectangle for {module_id} "
                    f"on level {level} at ({x:.1f}, {y:.1f})"
                )

            coordinates[module_id] = {
                "level": level,
                "sourcePage": source_page,
                "sheetX": round(x, 1),
                "sheetY": round(y, 1),
                "sheetXMin": round(outline.x_min, 1),
                "sheetXMax": round(outline.x_max, 1),
                "sheetYMin": round(outline.y_min, 1),
                "sheetYMax": round(outline.y_max, 1),
                "sheetWidth": round(outline.width, 1),
                "sheetHeight": round(outline.height, 1),
            }

    if len(coordinates) != EXPECTED_MODULE_COUNT:
        raise SystemExit(
            f"Expected {EXPECTED_MODULE_COUNT} module coordinates, got {len(coordinates)}"
        )

    return coordinates


def emit_typescript(coordinates: dict[str, dict[str, float | int]]) -> None:
    lines = [
        "export type ModuleCoordinate = {",
        "  level: number;",
        "  sourcePage: number;",
        "  sheetX: number;",
        "  sheetY: number;",
        "  sheetXMin: number;",
        "  sheetXMax: number;",
        "  sheetYMin: number;",
        "  sheetYMax: number;",
        "  sheetWidth: number;",
        "  sheetHeight: number;",
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
            f'sheetX: {coordinate["sheetX"]}, sheetY: {coordinate["sheetY"]}, '
            f'sheetXMin: {coordinate["sheetXMin"]}, sheetXMax: {coordinate["sheetXMax"]}, '
            f'sheetYMin: {coordinate["sheetYMin"]}, sheetYMax: {coordinate["sheetYMax"]}, '
            f'sheetWidth: {coordinate["sheetWidth"]}, '
            f'sheetHeight: {coordinate["sheetHeight"]} }},'
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
