import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { ResultsPagination } from "./ResultsPagination";
import { GridApi } from "ag-grid-community";

describe("ResultsPagination", () => {
  let mockGridApi: Partial<GridApi>;
  let gridRef: React.RefObject<{ api: GridApi }>;
  let paginationChangedListeners: Array<() => void> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    paginationChangedListeners = [];

    mockGridApi = {
      paginationGetCurrentPage: vi.fn(() => 0),
      paginationGetTotalPages: vi.fn(() => 1),
      paginationGoToPage: vi.fn(),
      addEventListener: vi.fn((event: string, listener: () => void) => {
        if (event === "paginationChanged") {
          paginationChangedListeners.push(listener);
        }
      }),
      removeEventListener: vi.fn((event: string, listener: () => void) => {
        if (event === "paginationChanged") {
          paginationChangedListeners = paginationChangedListeners.filter(
            (l) => l !== listener
          );
        }
      }),
    };

    gridRef = {
      current: {
        api: mockGridApi as GridApi,
      },
    };
  });

  describe("Rendering with valid statistics", () => {
    it("should render all statistics when provided", () => {
      const statistics = {
        elapsed: 0.5, // 500 ms (0.5 seconds * 1000)
        rows_read: 1000,
        bytes_read: 1048576, // 1 MB
      };

      const { container } = render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      expect(container.textContent).toContain("500.00 ms");
      expect(container.textContent).toContain("1,000");
      expect(container.textContent).toContain("1 MB");
    });

    it("should format elapsed time in microseconds", () => {
      const statistics = {
        elapsed: 0.0005, // 500 μs
        rows_read: 100,
        bytes_read: 1024,
      };

      const { container } = render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      expect(container.textContent).toContain("500.00 μs");
    });

    it("should format elapsed time in seconds", () => {
      const statistics = {
        elapsed: 2.5,
        rows_read: 100,
        bytes_read: 1024,
      };

      const { container } = render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      expect(container.textContent).toContain("2.50 s");
    });

    it("should format bytes in KB", () => {
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 2048, // 2 KB
      };

      const { container } = render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      expect(container.textContent).toContain("2 KB");
    });

    it("should format bytes in GB", () => {
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1073741824, // 1 GB
      };

      const { container } = render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      expect(container.textContent).toContain("1 GB");
    });

    it("should format zero bytes correctly", () => {
      const statistics = {
        elapsed: 0.1,
        rows_read: 0,
        bytes_read: 0,
      };

      const { container } = render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      expect(container.textContent).toContain("0 Bytes");
    });

    it("should format rows with locale string (comma separator)", () => {
      const statistics = {
        elapsed: 0.1,
        rows_read: 1000000,
        bytes_read: 1024,
      };

      const { container } = render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      expect(container.textContent).toContain("1,000,000");
    });
  });

  describe("Rendering with null/undefined statistics", () => {
    it("should display 'No statistics available' when statistics is null", () => {
      render(<ResultsPagination statistics={null} gridRef={gridRef} />);

      expect(screen.getByText("No statistics available")).toBeInTheDocument();
    });

    it("should not display individual stat items when statistics is null", () => {
      render(<ResultsPagination statistics={null} gridRef={gridRef} />);

      expect(screen.queryByText(/rows/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Bytes|KB|MB|GB|TB/)).not.toBeInTheDocument();
    });
  });

  describe("Pagination controls - single page", () => {
    it("should not render pagination controls when totalPages is 1", () => {
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      // Check for pagination elements that should not exist
      const buttons = screen.queryAllByRole("button");
      expect(buttons.length).toBe(0);
    });
  });

  describe("Pagination controls - multiple pages", () => {
    beforeEach(() => {
      (mockGridApi.paginationGetTotalPages as any).mockReturnValue(5);
    });

    it("should render pagination controls when totalPages > 1", () => {
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      expect(screen.getByDisplayValue("1")).toBeInTheDocument();
      expect(screen.getByText("of 5")).toBeInTheDocument();
    });

    it("should disable previous button on first page", () => {
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const prevButton = screen.getByTitle("Previous page (Alt+Left)");
      expect(prevButton).toBeDisabled();
    });

    it("should disable next button on last page", () => {
      (mockGridApi.paginationGetCurrentPage as any).mockReturnValue(4);

      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const nextButton = screen.getByTitle("Next page (Alt+Right)");
      expect(nextButton).toBeDisabled();
    });

    it("should enable both buttons on middle page", () => {
      (mockGridApi.paginationGetCurrentPage as any).mockReturnValue(2);

      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const prevButton = screen.getByTitle("Previous page (Alt+Left)");
      const nextButton = screen.getByTitle("Next page (Alt+Right)");

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe("Pagination API interaction", () => {
    beforeEach(() => {
      (mockGridApi.paginationGetTotalPages as any).mockReturnValue(5);
    });

    it("should call paginationGetCurrentPage and paginationGetTotalPages on mount", () => {
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      expect(mockGridApi.paginationGetCurrentPage).toHaveBeenCalled();
      expect(mockGridApi.paginationGetTotalPages).toHaveBeenCalled();
    });

    it("should register paginationChanged event listener on mount", () => {
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      expect(mockGridApi.addEventListener).toHaveBeenCalledWith(
        "paginationChanged",
        expect.any(Function)
      );
    });

    it("should unregister paginationChanged event listener on unmount", () => {
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      const { unmount } = render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      unmount();

      expect(mockGridApi.removeEventListener).toHaveBeenCalledWith(
        "paginationChanged",
        expect.any(Function)
      );
    });

    it("should update pagination state when paginationChanged event fires", async () => {
      (mockGridApi.paginationGetTotalPages as any).mockReturnValue(5);
      (mockGridApi.paginationGetCurrentPage as any).mockReturnValue(1);

      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      // Initial state shows page 2 (page 1 in 0-indexed format)
      expect(screen.getByDisplayValue("2")).toBeInTheDocument();

      // Simulate pagination change to page 4 (0-indexed: 3)
      (mockGridApi.paginationGetCurrentPage as any).mockReturnValue(3);
      paginationChangedListeners.forEach((listener) => listener());

      // Wait for state update with React's state change
      await waitFor(() => {
        expect(screen.getByDisplayValue("4")).toBeInTheDocument();
      });
    });
  });

  describe("Previous button interaction", () => {
    beforeEach(() => {
      (mockGridApi.paginationGetTotalPages as any).mockReturnValue(5);
      (mockGridApi.paginationGetCurrentPage as any).mockReturnValue(2);
    });

    it("should call paginationGoToPage with correct page when previous button clicked", async () => {
      const user = userEvent.setup();
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const prevButton = screen.getByTitle("Previous page (Alt+Left)");
      await user.click(prevButton);

      expect(mockGridApi.paginationGoToPage).toHaveBeenCalledWith(1);
    });

    it("should not allow going below page 1", async () => {
      const user = userEvent.setup();
      (mockGridApi.paginationGetCurrentPage as any).mockReturnValue(0);

      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const prevButton = screen.getByTitle("Previous page (Alt+Left)");
      expect(prevButton).toBeDisabled();
    });
  });

  describe("Next button interaction", () => {
    beforeEach(() => {
      (mockGridApi.paginationGetTotalPages as any).mockReturnValue(5);
      (mockGridApi.paginationGetCurrentPage as any).mockReturnValue(2);
    });

    it("should call paginationGoToPage with correct page when next button clicked", async () => {
      const user = userEvent.setup();
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const nextButton = screen.getByTitle("Next page (Alt+Right)");
      await user.click(nextButton);

      expect(mockGridApi.paginationGoToPage).toHaveBeenCalledWith(3);
    });

    it("should not allow going beyond last page", async () => {
      const user = userEvent.setup();
      (mockGridApi.paginationGetCurrentPage as any).mockReturnValue(4);

      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const nextButton = screen.getByTitle("Next page (Alt+Right)");
      expect(nextButton).toBeDisabled();
    });
  });

  describe("Page input field interaction", () => {
    beforeEach(() => {
      (mockGridApi.paginationGetTotalPages as any).mockReturnValue(5);
    });

    it("should accept numeric input only", async () => {
      const user = userEvent.setup();
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const input = screen.getByLabelText("Current page") as HTMLInputElement;
      await user.click(input);
      await user.keyboard("2");

      // Numeric input should work
      expect(input.value).toContain("2");

      // Clear and try non-numeric
      await user.clear(input);
      await user.keyboard("a");

      // Non-numeric should not be added
      expect(input.value).toBe("");
    });

    it("should allow empty input temporarily", async () => {
      const user = userEvent.setup();
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const input = screen.getByDisplayValue("1");
      await user.clear(input);

      expect(input).toHaveValue("");
    });

    it("should go to page on Enter key", async () => {
      const user = userEvent.setup();
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const input = screen.getByDisplayValue("1") as HTMLInputElement;
      await user.clear(input);
      await user.type(input, "3");
      await user.keyboard("{Enter}");

      expect(mockGridApi.paginationGoToPage).toHaveBeenCalledWith(2);
      expect(document.activeElement).not.toBe(input);
    });

    it("should reset to current page on invalid Enter", async () => {
      const user = userEvent.setup();
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const input = screen.getByDisplayValue("1");
      await user.clear(input);
      await user.keyboard("{Enter}");

      expect(input).toHaveValue("1");
    });

    it("should reset to current page on Escape key", async () => {
      const user = userEvent.setup();
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const input = screen.getByDisplayValue("1");
      await user.clear(input);
      await user.type(input, "3");
      await user.keyboard("{Escape}");

      expect(input).toHaveValue("1");
      expect(document.activeElement).not.toBe(input);
    });

    it("should navigate to page on blur with valid input", async () => {
      const user = userEvent.setup();
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const input = screen.getByDisplayValue("1");
      await user.clear(input);
      await user.type(input, "3");
      await user.click(document.body);

      expect(mockGridApi.paginationGoToPage).toHaveBeenCalledWith(2);
    });

    it("should reset to current page on blur with invalid input", async () => {
      const user = userEvent.setup();
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const input = screen.getByDisplayValue("1");
      await user.clear(input);
      await user.click(document.body);

      expect(input).toHaveValue("1");
    });

    it("should clamp page number to valid range", async () => {
      const user = userEvent.setup();
      (mockGridApi.paginationGetTotalPages as any).mockReturnValue(5);
      vi.clearAllMocks();

      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const input = screen.getByLabelText("Current page");
      await user.click(input);
      await user.keyboard("100");
      await user.keyboard("{Enter}");

      // 100 gets clamped to 5, which becomes page index 4 (5 - 1)
      expect(mockGridApi.paginationGoToPage).toHaveBeenCalledWith(4);
    });

    it("should reject non-digit characters", async () => {
      const user = userEvent.setup();
      (mockGridApi.paginationGetTotalPages as any).mockReturnValue(5);
      vi.clearAllMocks();

      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const input = screen.getByLabelText("Current page") as HTMLInputElement;
      await user.clear(input);
      // Regex only accepts digits
      await user.keyboard("a1b2c");

      // Only digits should be accepted: "12"
      expect(input.value).toBe("12");
    });
  });

  describe("Edge cases", () => {
    it("should handle missing grid API gracefully", () => {
      const badGridRef = { current: null };
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      const { container } = render(
        <ResultsPagination
          statistics={statistics}
          gridRef={badGridRef as any}
        />
      );

      expect(container).toBeInTheDocument();
      // Component renders without crashing
      expect(container.querySelectorAll("[aria-label]").length).toBeGreaterThanOrEqual(0);
    });

    it("should handle gridRef without api property", () => {
      const badGridRef = { current: {} };
      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      const { container } = render(
        <ResultsPagination
          statistics={statistics}
          gridRef={badGridRef as any}
        />
      );

      expect(container).toBeInTheDocument();
      // Component doesn't crash with invalid gridRef
      expect(container.querySelector(".flex")).toBeInTheDocument();
    });

    it("should handle rapid page changes", async () => {
      const user = userEvent.setup();
      (mockGridApi.paginationGetTotalPages as any).mockReturnValue(10);

      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const nextButton = screen.getByTitle("Next page (Alt+Right)");

      await user.click(nextButton);
      await user.click(nextButton);
      await user.click(nextButton);

      expect(mockGridApi.paginationGoToPage).toHaveBeenCalledTimes(3);
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label for page input", () => {
      (mockGridApi.paginationGetTotalPages as any).mockReturnValue(5);

      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      const input = screen.getByLabelText("Current page");
      expect(input).toBeInTheDocument();
    });

    it("should have descriptive button titles", () => {
      (mockGridApi.paginationGetTotalPages as any).mockReturnValue(5);

      const statistics = {
        elapsed: 0.1,
        rows_read: 100,
        bytes_read: 1024,
      };

      render(
        <ResultsPagination statistics={statistics} gridRef={gridRef} />
      );

      expect(screen.getByTitle("Previous page (Alt+Left)")).toBeInTheDocument();
      expect(screen.getByTitle("Next page (Alt+Right)")).toBeInTheDocument();
    });
  });
});
