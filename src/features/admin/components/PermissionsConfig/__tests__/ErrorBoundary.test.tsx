import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import userEvent from "@testing-library/user-event";

/**
 * Component that throws an error for testing
 */
function ErrorThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error from component");
  }
  return <div>Component rendered successfully</div>;
}

describe("ErrorBoundary for Permissions Layers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error in tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("ErrorBoundary Component", () => {
    it("should render children when no error occurs", () => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Component rendered successfully")).toBeInTheDocument();
    });

    it("should catch errors and display fallback UI", () => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText(/An error occurred while rendering/)).toBeInTheDocument();
    });

    it("should display error details when expanded", async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      const detailsButton = screen.getByText("Error details");
      expect(detailsButton).toBeInTheDocument();

      // Click to expand details
      await user.click(detailsButton);

      // Error message should be visible
      expect(screen.getByText(/Test error from component/)).toBeInTheDocument();
    });

    it("should call custom onError handler when error occurs", () => {
      const onErrorMock = vi.fn();

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it("should use custom fallback when provided", () => {
      const customFallback = (error: Error) => (
        <div>Custom error: {error.message}</div>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Custom error: Test error from component/)).toBeInTheDocument();
    });
  });

  describe("Enhanced Error Logging", () => {
    it("should log errors with context (layer, user, operation)", () => {
      const consoleErrorSpy = vi.spyOn(console, "error");
      const onErrorMock = vi.fn((error, errorInfo) => {
        console.error("Users layer error:", {
          layer: "users",
          user: "test_user",
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      });

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Users layer error:",
        expect.objectContaining({
          layer: "users",
          user: "test_user",
          error: expect.stringContaining("Test error from component"),
          stack: expect.any(String),
          componentStack: expect.any(String),
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
