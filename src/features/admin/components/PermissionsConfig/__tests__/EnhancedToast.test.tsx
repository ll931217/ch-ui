import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { useEnhancedToast } from "../hooks/useEnhancedToast";

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn((msg, opts) => `success-${Date.now()}`),
    error: vi.fn((msg, opts) => `error-${Date.now()}`),
    warning: vi.fn((msg, opts) => `warning-${Date.now()}`),
    info: vi.fn((msg, opts) => `info-${Date.now()}`),
    loading: vi.fn((msg, opts) => `loading-${Date.now()}`),
    promise: vi.fn((promise, opts) => promise),
    custom: vi.fn((component, opts) => `custom-${Date.now()}`),
    dismiss: vi.fn(),
  },
}));

describe("Enhanced Toast System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useEnhancedToast Hook", () => {
    it("should show success toast with details", async () => {
      const sonner = await import("sonner");

      const TestComponent = () => {
        const toast = useEnhancedToast();
        return (
          <button
            onClick={() =>
              toast.success("Operation successful", {
                details: "User 'john_doe' has been created",
              })
            }
          >
            Show Success
          </button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByText("Show Success");
      await userEvent.click(button);

      expect(sonner.toast.success).toHaveBeenCalledWith(
        "Operation successful",
        expect.objectContaining({
          description: "User 'john_doe' has been created",
        })
      );
    });

    it("should show success toast with undo button", async () => {
      const sonner = await import("sonner");
      const mockUndo = vi.fn();

      const TestComponent = () => {
        const toast = useEnhancedToast();
        return (
          <button
            onClick={() =>
              toast.success("Change applied", {
                showUndo: true,
                onUndo: mockUndo,
              })
            }
          >
            Show with Undo
          </button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByText("Show with Undo");
      await userEvent.click(button);

      expect(sonner.toast.success).toHaveBeenCalledWith(
        "Change applied",
        expect.objectContaining({
          action: expect.objectContaining({
            label: "Undo",
          }),
        })
      );
    });

    it("should show error toast with context", async () => {
      const sonner = await import("sonner");

      const TestComponent = () => {
        const toast = useEnhancedToast();
        return (
          <button
            onClick={() =>
              toast.error("Operation failed", {
                details: "DB::Exception: Access denied for user 'readonly'",
              })
            }
          >
            Show Error
          </button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByText("Show Error");
      await userEvent.click(button);

      expect(sonner.toast.error).toHaveBeenCalledWith(
        "Operation failed",
        expect.objectContaining({
          description: "DB::Exception: Access denied for user 'readonly'",
          duration: 6000,
        })
      );
    });

    it("should show warning toast", async () => {
      const sonner = await import("sonner");

      const TestComponent = () => {
        const toast = useEnhancedToast();
        return (
          <button
            onClick={() =>
              toast.warning("Partial completion", {
                details: "3 of 5 changes were applied successfully",
              })
            }
          >
            Show Warning
          </button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByText("Show Warning");
      await userEvent.click(button);

      expect(sonner.toast.warning).toHaveBeenCalledWith(
        "Partial completion",
        expect.objectContaining({
          description: "3 of 5 changes were applied successfully",
        })
      );
    });

    it("should show info toast", async () => {
      const sonner = await import("sonner");

      const TestComponent = () => {
        const toast = useEnhancedToast();
        return (
          <button
            onClick={() =>
              toast.info("Change staged", {
                details: "GRANT SELECT ON database.table TO user",
              })
            }
          >
            Show Info
          </button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByText("Show Info");
      await userEvent.click(button);

      expect(sonner.toast.info).toHaveBeenCalledWith(
        "Change staged",
        expect.objectContaining({
          description: "GRANT SELECT ON database.table TO user",
        })
      );
    });

    it("should show loading toast", async () => {
      const sonner = await import("sonner");

      const TestComponent = () => {
        const toast = useEnhancedToast();
        return (
          <button
            onClick={() =>
              toast.loading("Executing changes...", {
                details: "Please wait while changes are applied",
              })
            }
          >
            Show Loading
          </button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByText("Show Loading");
      await userEvent.click(button);

      expect(sonner.toast.loading).toHaveBeenCalledWith(
        "Executing changes...",
        expect.objectContaining({
          description: "Please wait while changes are applied",
        })
      );
    });

    it("should show persistent toast (no auto-dismiss)", async () => {
      const sonner = await import("sonner");

      const TestComponent = () => {
        const toast = useEnhancedToast();
        return (
          <button
            onClick={() =>
              toast.error("Critical error", {
                persist: true,
                details: "Manual intervention required",
              })
            }
          >
            Show Persistent
          </button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByText("Show Persistent");
      await userEvent.click(button);

      expect(sonner.toast.error).toHaveBeenCalledWith(
        "Critical error",
        expect.objectContaining({
          duration: Infinity,
        })
      );
    });

    it("should show grouped notifications", async () => {
      const sonner = await import("sonner");

      const TestComponent = () => {
        const toast = useEnhancedToast();
        return (
          <button
            onClick={() =>
              toast.group("Multiple changes applied", [
                "User 'john_doe' created",
                "Role 'analyst' assigned",
                "Quota 'standard' applied",
              ])
            }
          >
            Show Group
          </button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByText("Show Group");
      await userEvent.click(button);

      expect(sonner.toast.info).toHaveBeenCalledWith(
        "Multiple changes applied",
        expect.objectContaining({
          description: expect.stringContaining("User 'john_doe' created"),
        })
      );
    });

    it("should dismiss specific toast by ID", async () => {
      const sonner = await import("sonner");

      const TestComponent = () => {
        const toast = useEnhancedToast();
        const [toastId, setToastId] = React.useState<string | number | null>(null);

        return (
          <div>
            <button
              onClick={() => {
                const result = toast.success("Test toast");
                setToastId(result.id);
              }}
            >
              Show Toast
            </button>
            <button
              onClick={() => {
                if (toastId) toast.dismiss(toastId);
              }}
            >
              Dismiss Toast
            </button>
          </div>
        );
      };

      render(<TestComponent />);

      const showButton = screen.getByText("Show Toast");
      await userEvent.click(showButton);

      const dismissButton = screen.getByText("Dismiss Toast");
      await userEvent.click(dismissButton);

      expect(sonner.toast.dismiss).toHaveBeenCalled();
    });

    it("should dismiss all toasts", async () => {
      const sonner = await import("sonner");

      const TestComponent = () => {
        const toast = useEnhancedToast();
        return (
          <button onClick={() => toast.dismissAll()}>Dismiss All</button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByText("Dismiss All");
      await userEvent.click(button);

      expect(sonner.toast.dismiss).toHaveBeenCalledWith();
    });
  });

  describe("Undo Functionality", () => {
    it("should call onUndo callback when undo button is clicked", async () => {
      const sonner = await import("sonner");
      const mockUndo = vi.fn().mockResolvedValue(undefined);

      const TestComponent = () => {
        const toast = useEnhancedToast();
        return (
          <button
            onClick={() => {
              toast.success("Change applied", {
                showUndo: true,
                onUndo: mockUndo,
              });
            }}
          >
            Apply Change
          </button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByText("Apply Change");
      await userEvent.click(button);

      // Get the action callback from the mock call
      const call = (sonner.toast.success as any).mock.calls[0];
      const action = call[1].action;

      expect(action).toBeDefined();
      expect(action.label).toBe("Undo");

      // Simulate clicking the undo button
      await action.onClick();

      await waitFor(() => {
        expect(mockUndo).toHaveBeenCalled();
      });
    });

    it("should show success toast when undo succeeds", async () => {
      const sonner = await import("sonner");
      const mockUndo = vi.fn().mockResolvedValue(undefined);

      const TestComponent = () => {
        const toast = useEnhancedToast();
        return (
          <button
            onClick={() => {
              toast.success("Change applied", {
                showUndo: true,
                onUndo: mockUndo,
              });
            }}
          >
            Apply Change
          </button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByText("Apply Change");
      await userEvent.click(button);

      const call = (sonner.toast.success as any).mock.calls[0];
      const action = call[1].action;

      await action.onClick();

      await waitFor(() => {
        // Should show "Change reverted" success toast
        expect(sonner.toast.success).toHaveBeenCalledWith(
          "Change reverted",
          expect.objectContaining({
            duration: 2000,
          })
        );
      });
    });

    it("should show error toast when undo fails", async () => {
      const sonner = await import("sonner");
      const mockUndo = vi.fn().mockRejectedValue(new Error("Undo failed"));

      const TestComponent = () => {
        const toast = useEnhancedToast();
        return (
          <button
            onClick={() => {
              toast.success("Change applied", {
                showUndo: true,
                onUndo: mockUndo,
              });
            }}
          >
            Apply Change
          </button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByText("Apply Change");
      await userEvent.click(button);

      const call = (sonner.toast.success as any).mock.calls[0];
      const action = call[1].action;

      await action.onClick();

      await waitFor(() => {
        expect(sonner.toast.error).toHaveBeenCalledWith(
          expect.stringContaining("Failed to undo")
        );
      });
    });
  });

  describe("Toast Return Value", () => {
    it("should return toast ID and dismiss function", async () => {
      const TestComponent = () => {
        const toast = useEnhancedToast();
        const [result, setResult] = React.useState<any>(null);

        return (
          <div>
            <button
              onClick={() => {
                const res = toast.success("Test");
                setResult(res);
              }}
            >
              Show Toast
            </button>
            {result && (
              <>
                <div data-testid="toast-id">{result.id}</div>
                <button onClick={() => result.dismiss()}>Dismiss</button>
              </>
            )}
          </div>
        );
      };

      render(<TestComponent />);
      const showButton = screen.getByText("Show Toast");
      await userEvent.click(showButton);

      await waitFor(() => {
        expect(screen.getByTestId("toast-id")).toBeInTheDocument();
      });
    });
  });
});
