import { fireEvent, render, screen } from "@testing-library/react";
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
        selectedTranches={[]}
        showAllLevels={false}
        showShell
        showWireframe
        exploded={false}
        onLevelChange={onLevelChange}
        onTrancheToggle={vi.fn()}
        onToggleAllLevels={vi.fn()}
        onToggleShell={vi.fn()}
        onToggleWireframe={vi.fn()}
        onToggleExploded={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Level 3" }));

    expect(onLevelChange).toHaveBeenCalledWith(3);
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
