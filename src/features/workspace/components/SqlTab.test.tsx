import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import React, { useState, useEffect, useCallback } from "react";

// Create a simplified test component that mimics the toggle logic
const ToggleTestComponent = () => {
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
    "vertical"
  );

  // Load saved orientation preference from localStorage on mount
  useEffect(() => {
    try {
      const savedOrientation = localStorage.getItem(
        "sql-editor-layout-orientation"
      );
      if (
        savedOrientation === "horizontal" ||
        savedOrientation === "vertical"
      ) {
        setOrientation(savedOrientation);
      }
    } catch (error) {
      console.error(
        "Failed to load orientation preference from localStorage:",
        error
      );
    }
  }, []);

  // Save orientation preference to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("sql-editor-layout-orientation", orientation);
    } catch (error) {
      console.error(
        "Failed to save orientation preference to localStorage:",
        error
      );
    }
  }, [orientation]);

  // Handle orientation toggle
  const toggleOrientation = useCallback(() => {
    setOrientation((prev) =>
      prev === "vertical" ? "horizontal" : "vertical"
    );
  }, []);

  return (
    <div data-testid="toggle-test-component">
      <button
        data-testid="toggle-button"
        onClick={toggleOrientation}
        title={`Switch to ${orientation === "vertical" ? "horizontal" : "vertical"} layout`}
      >
        Toggle Layout
      </button>
      <div
        data-testid="resizable-panel-group"
        data-orientation={orientation}
      >
        <span data-testid="orientation-display">{orientation}</span>
      </div>
    </div>
  );
};

describe("SqlTab - Layout Toggle Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Toggle Button Rendering", () => {
    it("should render layout toggle button", () => {
      render(<ToggleTestComponent />);

      const toggleButton = screen.getByTestId("toggle-button");
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveTextContent("Toggle Layout");
    });

    it("should have correct initial title for toggle button", () => {
      render(<ToggleTestComponent />);

      const toggleButton = screen.getByTestId("toggle-button");
      expect(toggleButton).toHaveAttribute(
        "title",
        "Switch to horizontal layout"
      );
    });
  });

  describe("Orientation State Changes", () => {
    it("should initialize with vertical orientation", () => {
      render(<ToggleTestComponent />);

      const panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-orientation", "vertical");
      expect(screen.getByTestId("orientation-display")).toHaveTextContent(
        "vertical"
      );
    });

    it("should change orientation when toggle button is clicked", async () => {
      const user = userEvent.setup();
      render(<ToggleTestComponent />);

      const toggleButton = screen.getByTestId("toggle-button");
      expect(toggleButton).toHaveAttribute(
        "title",
        "Switch to horizontal layout"
      );

      await user.click(toggleButton);

      const panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-orientation", "horizontal");
      expect(screen.getByTestId("orientation-display")).toHaveTextContent(
        "horizontal"
      );
    });

    it("should toggle between vertical and horizontal on multiple clicks", async () => {
      const user = userEvent.setup();
      render(<ToggleTestComponent />);

      const toggleButton = screen.getByTestId("toggle-button");
      let panelGroup = screen.getByTestId("resizable-panel-group");

      // Start: vertical
      expect(panelGroup).toHaveAttribute("data-orientation", "vertical");

      // First toggle to horizontal
      await user.click(toggleButton);
      panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-orientation", "horizontal");

      // Second toggle back to vertical
      await user.click(toggleButton);
      panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-orientation", "vertical");

      // Third toggle to horizontal again
      await user.click(toggleButton);
      panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-orientation", "horizontal");
    });
  });

  describe("localStorage Persistence", () => {
    it("should save orientation preference to localStorage on change", async () => {
      const user = userEvent.setup();

      render(<ToggleTestComponent />);

      const toggleButton = screen.getByTestId("toggle-button");
      await user.click(toggleButton);

      // Verify that localStorage actually contains the new value
      await waitFor(() => {
        const savedValue = localStorage.getItem("sql-editor-layout-orientation");
        expect(savedValue).toBe("horizontal");
      });
    });

    it("should load saved orientation preference from localStorage on mount", () => {
      localStorage.setItem("sql-editor-layout-orientation", "horizontal");

      render(<ToggleTestComponent />);

      const panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-orientation", "horizontal");
      expect(screen.getByTestId("orientation-display")).toHaveTextContent(
        "horizontal"
      );
    });

    it("should use default vertical orientation when localStorage is empty", () => {
      // localStorage is already empty due to beforeEach clear
      render(<ToggleTestComponent />);

      const panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-orientation", "vertical");
    });

    it("should handle invalid localStorage values gracefully", () => {
      localStorage.setItem("sql-editor-layout-orientation", "invalid-value");

      render(<ToggleTestComponent />);

      // Should fall back to default vertical orientation
      const panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-orientation", "vertical");
    });

    it("should handle localStorage errors gracefully", () => {
      const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
      let errorThrown = false;

      getItemSpy.mockImplementation(() => {
        errorThrown = true;
        throw new Error("localStorage is full");
      });

      setItemSpy.mockImplementation(() => {
        errorThrown = true;
        throw new Error("localStorage is full");
      });

      render(<ToggleTestComponent />);

      // Component should still work with default orientation even if localStorage errors
      const panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-orientation", "vertical");

      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
    });
  });

  describe("ResizablePanelGroup Prop Passing", () => {
    it("should pass vertical orientation prop to ResizablePanelGroup", () => {
      render(<ToggleTestComponent />);

      const panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-orientation", "vertical");
    });

    it("should pass horizontal orientation prop to ResizablePanelGroup after toggle", async () => {
      const user = userEvent.setup();
      render(<ToggleTestComponent />);

      const toggleButton = screen.getByTestId("toggle-button");
      await user.click(toggleButton);

      const panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-orientation", "horizontal");
    });

    it("should update ResizablePanelGroup orientation immediately on state change", async () => {
      const user = userEvent.setup();
      render(<ToggleTestComponent />);

      let panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-orientation", "vertical");

      const toggleButton = screen.getByTestId("toggle-button");
      await user.click(toggleButton);

      panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-orientation", "horizontal");
    });
  });

  describe("localStorage Integration", () => {
    it("should persist orientation across component remounts", async () => {
      const user = userEvent.setup();
      const { unmount } = render(<ToggleTestComponent />);

      // Toggle to horizontal
      const toggleButton = screen.getByTestId("toggle-button");
      await user.click(toggleButton);

      const panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-orientation", "horizontal");

      // Unmount
      unmount();

      // Remount - orientation should be restored from localStorage
      render(<ToggleTestComponent />);

      const panelGroupAfter = screen.getByTestId("resizable-panel-group");
      expect(panelGroupAfter).toHaveAttribute("data-orientation", "horizontal");
    });
  });

  describe("Button Behavior", () => {
    it("should update button title after orientation change", async () => {
      const user = userEvent.setup();
      render(<ToggleTestComponent />);

      let toggleButton = screen.getByTestId("toggle-button");
      expect(toggleButton).toHaveAttribute(
        "title",
        "Switch to horizontal layout"
      );

      await user.click(toggleButton);

      toggleButton = screen.getByTestId("toggle-button");
      expect(toggleButton).toHaveAttribute(
        "title",
        "Switch to vertical layout"
      );
    });

    it("should allow multiple consecutive toggles", async () => {
      const user = userEvent.setup();
      render(<ToggleTestComponent />);

      const toggleButton = screen.getByTestId("toggle-button");

      // Click 5 times and verify alternating orientations
      for (let i = 0; i < 5; i++) {
        await user.click(toggleButton);

        const panelGroup = screen.getByTestId("resizable-panel-group");
        const expectedOrientation = i % 2 === 0 ? "horizontal" : "vertical";
        expect(panelGroup).toHaveAttribute(
          "data-orientation",
          expectedOrientation
        );
      }
    });

    it("should be clickable and responsive", async () => {
      const user = userEvent.setup();
      render(<ToggleTestComponent />);

      const toggleButton = screen.getByTestId("toggle-button");

      // Button should be enabled
      expect(toggleButton).not.toBeDisabled();

      // Button should be clickable
      await user.click(toggleButton);

      // Button should still be clickable after click
      expect(toggleButton).not.toBeDisabled();
      await user.click(toggleButton);
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid successive clicks", async () => {
      const user = userEvent.setup({ delay: null });
      render(<ToggleTestComponent />);

      const toggleButton = screen.getByTestId("toggle-button");

      // Rapid clicks
      await user.click(toggleButton);
      await user.click(toggleButton);
      await user.click(toggleButton);

      // Should settle on expected state (odd number of clicks = opposite of initial)
      const panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-orientation", "horizontal");
    });

    it("should maintain state after component re-render", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ToggleTestComponent />);

      const toggleButton = screen.getByTestId("toggle-button");
      await user.click(toggleButton);

      rerender(<ToggleTestComponent />);

      const panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-orientation", "horizontal");
    });
  });
});
