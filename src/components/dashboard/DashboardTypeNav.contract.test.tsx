import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import DashboardTypeNav from "@/components/dashboard/DashboardTypeNav";

describe("DashboardTypeNav contract", () => {
  it("always routes University Dashboard to /app/university without routePrefix", () => {
    render(
      <MemoryRouter>
        <DashboardTypeNav activeType="company" />
      </MemoryRouter>,
    );

    const universityLink = screen.getByRole("link", { name: /University Dashboard/i });
    expect(universityLink).toHaveAttribute("href", "/app/university");
  });

  it("routes University Dashboard to /app/university with app routePrefix", () => {
    render(
      <MemoryRouter>
        <DashboardTypeNav activeType="ca" routePrefix="/app" />
      </MemoryRouter>,
    );

    const universityLink = screen.getByRole("link", { name: /University Dashboard/i });
    expect(universityLink).toHaveAttribute("href", "/app/university");
  });
});
