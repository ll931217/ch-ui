import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { ConfirmationDialog } from "../ConfirmationDialog";

describe("ConfirmationDialog", () => {
  const mockOnConfirm = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic functionality", () => {
    it("should render when open", () => {
      render(
        <ConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Test Dialog"
          description="Test description"
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText("Test Dialog")).toBeInTheDocument();
      expect(screen.getByText("Test description")).toBeInTheDocument();
    });

    it("should not render when closed", () => {
      render(
        <ConfirmationDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          title="Test Dialog"
          description="Test description"
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByText("Test Dialog")).not.toBeInTheDocument();
    });

    it("should call onConfirm when confirm button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <ConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Test Dialog"
          description="Test description"
          onConfirm={mockOnConfirm}
        />
      );

      const confirmButton = screen.getByText("Confirm");
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledOnce();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onOpenChange when cancel button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <ConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Test Dialog"
          description="Test description"
          onConfirm={mockOnConfirm}
        />
      );

      const cancelButton = screen.getByText("Cancel");
      await user.click(cancelButton);

      expect(mockOnConfirm).not.toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Typed confirmation", () => {
    it("should require typing entity name before confirming", async () => {
      const user = userEvent.setup();

      render(
        <ConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Delete User"
          description="Confirm deletion"
          onConfirm={mockOnConfirm}
          requiresTypedConfirmation={true}
          entityName="test_user"
        />
      );

      const confirmButton = screen.getByText("Confirm");
      expect(confirmButton).toBeDisabled();

      // Type incorrect name
      const input = screen.getByPlaceholderText('Type "test_user" to confirm');
      await user.type(input, "wrong_name");

      expect(confirmButton).toBeDisabled();
      expect(screen.getByText(/Name does not match/)).toBeInTheDocument();

      // Type correct name
      await user.clear(input);
      await user.type(input, "test_user");

      expect(confirmButton).not.toBeDisabled();

      // Confirm should work now
      await user.click(confirmButton);
      expect(mockOnConfirm).toHaveBeenCalledOnce();
    });

    it("should reset typed name on cancel", async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <ConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Delete User"
          description="Confirm deletion"
          onConfirm={mockOnConfirm}
          requiresTypedConfirmation={true}
          entityName="test_user"
        />
      );

      const input = screen.getByPlaceholderText('Type "test_user" to confirm');
      await user.type(input, "test_user");

      const cancelButton = screen.getByText("Cancel");
      await user.click(cancelButton);

      // Reopen dialog
      rerender(
        <ConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Delete User"
          description="Confirm deletion"
          onConfirm={mockOnConfirm}
          requiresTypedConfirmation={true}
          entityName="test_user"
        />
      );

      const inputAfterReopen = screen.getByPlaceholderText('Type "test_user" to confirm');
      expect(inputAfterReopen).toHaveValue("");
    });
  });

  describe("Impact preview", () => {
    it("should display impact items", () => {
      const impactItems = [
        { type: "warning" as const, message: "5 grants will be revoked" },
        { type: "info" as const, message: "User has 2 role assignments" },
      ];

      render(
        <ConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Delete User"
          description="Confirm deletion"
          onConfirm={mockOnConfirm}
          impactPreview={impactItems}
        />
      );

      expect(screen.getByText("Impact Preview")).toBeInTheDocument();
      expect(screen.getByText("5 grants will be revoked")).toBeInTheDocument();
      expect(screen.getByText("User has 2 role assignments")).toBeInTheDocument();
    });
  });

  describe("Undo information", () => {
    it("should display undo info", () => {
      render(
        <ConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Delete User"
          description="Confirm deletion"
          onConfirm={mockOnConfirm}
          undoInfo="To restore this user, recreate it manually."
        />
      );

      expect(screen.getByText("Undo Information")).toBeInTheDocument();
      expect(screen.getByText("To restore this user, recreate it manually.")).toBeInTheDocument();
    });
  });

  describe("Keyboard navigation", () => {
    it("should confirm on Enter key when not disabled", async () => {
      const user = userEvent.setup();

      render(
        <ConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Test Dialog"
          description="Test description"
          onConfirm={mockOnConfirm}
        />
      );

      await user.keyboard("{Enter}");

      expect(mockOnConfirm).toHaveBeenCalledOnce();
    });

    it("should not confirm on Enter key when disabled", async () => {
      const user = userEvent.setup();

      render(
        <ConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Delete User"
          description="Confirm deletion"
          onConfirm={mockOnConfirm}
          requiresTypedConfirmation={true}
          entityName="test_user"
        />
      );

      await user.keyboard("{Enter}");

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it("should close on Escape key", async () => {
      const user = userEvent.setup();

      render(
        <ConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Test Dialog"
          description="Test description"
          onConfirm={mockOnConfirm}
        />
      );

      await user.keyboard("{Escape}");

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe("Loading state", () => {
    it("should disable buttons when loading", () => {
      render(
        <ConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Test Dialog"
          description="Test description"
          onConfirm={mockOnConfirm}
          isLoading={true}
        />
      );

      const confirmButton = screen.getByText("Processing...");
      const cancelButton = screen.getByText("Cancel");

      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe("Variant styles", () => {
    it("should display destructive variant with warning icon", () => {
      render(
        <ConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Delete User"
          description="Confirm deletion"
          onConfirm={mockOnConfirm}
          variant="destructive"
        />
      );

      // Check for alert triangle icon (destructive variant indicator)
      const dialogTitle = screen.getByText("Delete User").closest("h2");
      expect(dialogTitle?.previousSibling).toBeDefined();
    });
  });

  describe("Async confirmation", () => {
    it("should handle async onConfirm", async () => {
      const user = userEvent.setup();
      const asyncMockOnConfirm = vi.fn().mockResolvedValue(undefined);

      render(
        <ConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          title="Test Dialog"
          description="Test description"
          onConfirm={asyncMockOnConfirm}
        />
      );

      const confirmButton = screen.getByText("Confirm");
      await user.click(confirmButton);

      await waitFor(() => {
        expect(asyncMockOnConfirm).toHaveBeenCalledOnce();
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });
});
