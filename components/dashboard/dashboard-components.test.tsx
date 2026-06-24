import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { modules } from "@/data/modules";
import { DashboardShell } from "./DashboardShell";
import { TrancheLegend } from "./TrancheLegend";
import { UnitDetailPanel } from "./UnitDetailPanel";
import { ViewerToolbar } from "./ViewerToolbar";

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockDynamicViewer() {
      return null;
    },
}));

describe("ViewerToolbar", () => {
  it("calls level selection when a level chip is clicked", () => {
    const onLevelChange = vi.fn();

    render(
      <ViewerToolbar
        activeLevel={1}
        selectedModule={modules[0]}
        selectedTranches={[]}
        selectedZones={[]}
        showAllLevels={false}
        showShell
        showWireframe
        exploded={false}
        onLevelChange={onLevelChange}
        onTrancheToggle={vi.fn()}
        onZoneToggle={vi.fn()}
        onToggleAllLevels={vi.fn()}
        onToggleShell={vi.fn()}
        onToggleWireframe={vi.fn()}
        onToggleExploded={vi.fn()}
        onOpenModuleDetail={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Level 3" }));

    expect(onLevelChange).toHaveBeenCalledWith(3);
  });

  it("calls zone selection when a zone chip is clicked", () => {
    const onZoneToggle = vi.fn();

    render(
      <ViewerToolbar
        activeLevel={1}
        selectedModule={modules[0]}
        selectedTranches={[]}
        selectedZones={[]}
        showAllLevels={false}
        showShell
        showWireframe={false}
        exploded={false}
        onLevelChange={vi.fn()}
        onTrancheToggle={vi.fn()}
        onZoneToggle={onZoneToggle}
        onToggleAllLevels={vi.fn()}
        onToggleShell={vi.fn()}
        onToggleWireframe={vi.fn()}
        onToggleExploded={vi.fn()}
        onOpenModuleDetail={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Filter Market Rate East Wing" }));

    expect(onZoneToggle).toHaveBeenCalledWith("Market Rate East Wing");
  });

  it("keeps mobile filters collapsed until the filters button is opened", () => {
    render(
      <ViewerToolbar
        activeLevel={1}
        selectedModule={modules[0]}
        selectedTranches={[]}
        selectedZones={[]}
        showAllLevels={false}
        showShell
        showWireframe={false}
        exploded={false}
        onLevelChange={vi.fn()}
        onTrancheToggle={vi.fn()}
        onZoneToggle={vi.fn()}
        onToggleAllLevels={vi.fn()}
        onToggleShell={vi.fn()}
        onToggleWireframe={vi.fn()}
        onToggleExploded={vi.fn()}
        onOpenModuleDetail={vi.fn()}
      />,
    );

    const filtersButton = screen.getByRole("button", { name: "Filters" });
    const controls = document.getElementById("viewer-toolbar-controls");

    expect(filtersButton).toHaveAttribute("aria-expanded", "false");
    expect(controls).toHaveClass("hidden");

    fireEvent.click(filtersButton);

    expect(filtersButton).toHaveAttribute("aria-expanded", "true");
    expect(controls).not.toHaveClass("hidden");
  });

  it("opens selected module details from the compact mobile control", () => {
    const onOpenModuleDetail = vi.fn();

    render(
      <ViewerToolbar
        activeLevel={1}
        selectedModule={modules[0]}
        selectedTranches={[]}
        selectedZones={[]}
        showAllLevels={false}
        showShell
        showWireframe={false}
        exploded={false}
        onLevelChange={vi.fn()}
        onTrancheToggle={vi.fn()}
        onZoneToggle={vi.fn()}
        onToggleAllLevels={vi.fn()}
        onToggleShell={vi.fn()}
        onToggleWireframe={vi.fn()}
        onToggleExploded={vi.fn()}
        onOpenModuleDetail={onOpenModuleDetail}
      />,
    );

    expect(screen.getByText(modules[0].id)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: `View ${modules[0].id} details` }));

    expect(onOpenModuleDetail).toHaveBeenCalledTimes(1);
  });
});

describe("DashboardShell", () => {
  it("starts with wireframe turned off for smoother first load", () => {
    render(<DashboardShell />);

    expect(screen.getByRole("button", { name: "Wireframe" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows selected module details at the top of the sidebar without the tranche legend card", () => {
    render(<DashboardShell />);

    expect(screen.queryByRole("heading", { name: "Tranches" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: modules[0].id })).toBeInTheDocument();
  });

  it("renders zone filter controls beside the tranche controls", () => {
    render(<DashboardShell />);

    expect(screen.getByText("Zone filter")).toBeInTheDocument();
    expect(screen.getByText("Affordable")).toBeInTheDocument();
    expect(screen.getByText("Market - South")).toBeInTheDocument();
    expect(screen.getByText("Market - North")).toBeInTheDocument();
    expect(screen.getByText("Market - West")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter Residential Affordable" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter Market Rate South Wing" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter Market Rate West Wing" })).toBeInTheDocument();
  });

  it("opens selected module details in a mobile bottom sheet from the view button", async () => {
    render(<DashboardShell />);

    expect(screen.queryByRole("dialog", { name: "Selected module details" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: `View ${modules[0].id} details` }));

    expect(await screen.findByRole("dialog", { name: "Selected module details" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close module details" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Selected module details" })).not.toBeInTheDocument();
    });
  });

  it("widens the selected module panel from the desktop resize separator", () => {
    render(<DashboardShell />);

    const resizer = screen.getByRole("separator", {
      name: "Resize selected module panel",
    });

    expect(resizer).toHaveAttribute("aria-valuenow", "390");

    fireEvent.pointerDown(resizer, { clientX: 500, pointerId: 1 });
    fireEvent.pointerMove(resizer, { clientX: 300, pointerId: 1 });
    fireEvent.pointerUp(resizer, { pointerId: 1 });

    expect(resizer).toHaveAttribute("aria-valuenow", "590");
  });

  it("continues resizing the selected module panel during a mouse drag", () => {
    render(<DashboardShell />);

    const resizer = screen.getByRole("separator", {
      name: "Resize selected module panel",
    });

    fireEvent.mouseDown(resizer, { clientX: 500 });
    fireEvent.mouseMove(window, { clientX: 260 });
    fireEvent.mouseUp(window);

    expect(resizer).toHaveAttribute("aria-valuenow", "630");
  });
});

describe("TrancheLegend", () => {
  it("renders all tranche labels", () => {
    render(<TrancheLegend selectedTranches={[]} onToggle={vi.fn()} />);

    expect(screen.getByText("Tranche 1")).toBeInTheDocument();
    expect(screen.getByText("Tranche 2")).toBeInTheDocument();
    expect(screen.getByText("Tranche 3")).toBeInTheDocument();
    expect(screen.getByText("Tranche 4")).toBeInTheDocument();
  });
});

describe("UnitDetailPanel", () => {
  it("renders selected module metadata and source confidence", () => {
    render(<UnitDetailPanel module={modules[0]} />);

    expect(screen.getByText(modules[0].id)).toBeInTheDocument();
    expect(screen.getByText(modules[0].unitCode)).toBeInTheDocument();
    expect(screen.getByText(/Geometry is approximate/)).toBeInTheDocument();
  });

  it("renders master matrix metadata for the selected module", () => {
    render(<UnitDetailPanel module={modules[0]} />);

    expect(screen.queryByText("Matrix data")).not.toBeInTheDocument();
    expect(screen.queryByText("Source page")).not.toBeInTheDocument();
    expect(screen.queryByText(/Source-derived ID/)).not.toBeInTheDocument();
    expect(screen.getByText("CFA1M-H2")).toBeInTheDocument();
    expect(screen.getByText("11'-7\" x 12'-9\" x 11'-1\"")).toBeInTheDocument();
    expect(screen.getByText("10,725 lb")).toBeInTheDocument();
    expect(screen.getByText("West Modular")).toBeInTheDocument();
    expect(screen.getByText("Line 1 / Seq 352")).toBeInTheDocument();
    expect(screen.getByText("Mar 1, 2027")).toBeInTheDocument();
    expect(screen.getByText("Zone").closest("div")).toHaveClass("col-span-2");
  });

  it("renders a selected module schedule timeline from the master matrix", () => {
    render(<UnitDetailPanel module={modules[0]} />);

    fireEvent.click(screen.getByRole("button", { name: "Schedule" }));

    expect(
      screen.queryByAltText(`Source PDF page for ${modules[0].id}`),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Schedule timeline")).not.toBeInTheDocument();
    expect(screen.queryByText("By module")).not.toBeInTheDocument();
    expect(
      screen.queryByText(`${modules[0].id} schedule from master matrix dates`),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Chassis shop drawings")).toBeInTheDocument();
    expect(screen.getByText("Module shop drawings")).toBeInTheDocument();
    expect(screen.getByText("Chassis fabrication")).toBeInTheDocument();
    expect(screen.getByText("Module fabrication")).toBeInTheDocument();
    expect(screen.getByText("Shipping")).toBeInTheDocument();
    expect(screen.getByText("Yard inspection")).toBeInTheDocument();
    expect(screen.getByText(/Jul 16, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Mar 1, 2027/)).toBeInTheDocument();
    expect(screen.queryByText("Geometry is approximate from PDF/module schedule.")).not.toBeInTheDocument();
    expect(screen.getByTestId("schedule-timeline-scroll")).toHaveClass(
      "overflow-x-auto",
    );
  });

  it("keeps the phase column visually fixed outside the horizontal scroller", () => {
    render(<UnitDetailPanel module={modules[0]} />);

    fireEvent.click(screen.getByRole("button", { name: "Schedule" }));

    const phaseColumn = screen.getByTestId("schedule-phase-column");
    const timeline = screen.getByTestId("schedule-timeline-scroll");

    expect(timeline).not.toContainElement(phaseColumn);
    expect(phaseColumn).toHaveClass("border-r", "bg-white/[0.03]");
    expect(screen.getByTestId("schedule-phase-header")).toHaveClass(
      "bg-white/[0.03]",
    );
    expect(screen.getByTestId("schedule-phase-Chassis shop drawings")).toHaveClass(
      "bg-white/[0.03]",
    );
  });

  it("supports click and drag horizontal scrolling in the schedule timeline", () => {
    render(<UnitDetailPanel module={modules[0]} />);

    fireEvent.click(screen.getByRole("button", { name: "Schedule" }));

    const timeline = screen.getByTestId("schedule-timeline-scroll");
    timeline.scrollLeft = 300;

    fireEvent.pointerDown(timeline, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(timeline, { clientX: 150, pointerId: 1 });
    fireEvent.pointerUp(timeline, { pointerId: 1 });

    expect(timeline.scrollLeft).toBe(250);
  });

  it("keeps the details and schedule tabs above the PDF preview", () => {
    render(<UnitDetailPanel module={modules[0]} />);

    const scheduleButton = screen.getByRole("button", { name: "Schedule" });
    const pdfPreview = screen.getByAltText(`Source PDF page for ${modules[0].id}`);

    expect(
      scheduleButton.compareDocumentPosition(pdfPreview) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
