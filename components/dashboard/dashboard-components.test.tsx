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
});
