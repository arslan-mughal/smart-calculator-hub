import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-shell";
import { DEFAULT_SETTINGS } from "@/lib/site-settings";
import { categories } from "@/lib/registry";

// Rendering the header loads the full router + registry, which is slow
// under a parallel full-suite run; the default 5s timeout is too tight.
vi.setConfig({ testTimeout: 20000 });

async function renderHeader(path = "/") {
  const rootRoute = createRootRoute({
    component: () => <SiteHeader settings={DEFAULT_SETTINGS} />,
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
  return router;
}

describe("SiteHeader", () => {
  it("renders the brand, main nav and a search field", async () => {
    await renderHeader();
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("link", { name: /CalcHub home/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(within(header).getByRole("link", { name: "Blog" })).toHaveAttribute("href", "/blog");
    expect(within(header).getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
    // One search field in the desktop bar, one in the mobile drawer.
    expect(screen.getAllByLabelText("Search all tools")).toHaveLength(2);
  });

  it("All tools dropdown lists every category with its link", async () => {
    await renderHeader();
    const button = screen.getByRole("button", { name: /all tools/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    const panel = screen.getByTestId("tools-dropdown");
    const categoryLinks = within(panel)
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("/tools?category="));
    expect(categoryLinks).toHaveLength(categories.length);
    for (const category of categories) {
      const link = within(panel).getByRole("link", { name: new RegExp(category, "i") });
      // TanStack encodes query spaces as "+", like URLSearchParams does.
      expect(link.getAttribute("href")).toContain(
        `/tools?${new URLSearchParams({ category }).toString()}`,
      );
    }
    expect(within(panel).getByRole("link", { name: /view all 320 tools/i })).toHaveAttribute(
      "href",
      "/tools",
    );
  });

  it("hamburger opens the drawer, locks scroll, and Escape closes it", async () => {
    await renderHeader();
    const button = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(document.body.style.overflow).toBe("hidden");

    const drawer = document.getElementById("mobile-menu");
    expect(drawer).not.toBeNull();
    expect(within(drawer!).getByText("Categories")).toBeInTheDocument();
    expect(
      within(drawer!).getByRole("link", { name: /privacy/i }),
    ).toHaveAttribute("href", "/privacy");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(document.body.style.overflow).toBe("");
  });

  it("search icon opens the drawer with the search field focused", async () => {
    await renderHeader();
    fireEvent.click(screen.getByRole("button", { name: "Search tools" }));
    const drawer = document.getElementById("mobile-menu");
    expect(within(drawer!).getByLabelText("Search all tools")).toHaveFocus();
  });

  it("highlights All tools as active on a tool page", async () => {
    await renderHeader("/bmi-calculator");
    const button = screen.getByRole("button", { name: /all tools/i });
    expect(button.className).toContain("bg-muted");
  });
});
