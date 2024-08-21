import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import LinkCard from "./LinkCard";
import { PocketBaseProvider } from "@/hooks/usePocketBase";
import { toast, ToastProvider } from "@/components/ui/use-toast";

// Mock PocketBase
vi.mock("pocketbase", () => {
  return {
    default: vi.fn(() => ({
      authStore: {
        model: { id: "user123" },
        onChange: vi.fn(),
      },
      collection: vi.fn(() => ({
        update: vi.fn(),
        delete: vi.fn(),
      })),
    })),
  };
});

const { mockedToast } = vi.hoisted(() => ({
  mockedToast: vi.fn(),
}));
vi.mock("@/components/ui/use-toast", () => {
  return {
    useToast: () => ({
      toast: mockedToast,
    }),
    toast: vi.fn(),
    ToastProvider: vi.fn(({ children }) => children),
  };
});


describe("LinkCard", () => {
  const mockLink = {
    id: "1",
    title: "Test Link",
    hostname: "test.com",
    excerpt: "This is a test link",
    header_image_url: "https://test.com/image.jpg",
    last_viewed_at: null,
    added_to_library: new Date(),
    article_date: null,
    author: null,
    tags: [],
  };

  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLinkCard = () => {
    return render(
      <BrowserRouter>
        <PocketBaseProvider>
          <ToastProvider>
            <LinkCard link={mockLink} onUpdate={mockOnUpdate} />
          </ToastProvider>
        </PocketBaseProvider>
      </BrowserRouter>,
    );
  };

  it("renders link information correctly", () => {
    renderLinkCard();
    expect(screen.getByText("Test Link")).toBeInTheDocument();
    expect(screen.getByText("test.com")).toBeInTheDocument();
    expect(screen.getByText("This is a test link")).toBeInTheDocument();
  });

  it("shows unread indicator for unread links", () => {
    renderLinkCard();
    const unreadIndicator = screen.getByTestId("unread-indicator");
    expect(unreadIndicator).toBeInTheDocument();
  });

  it('toggles read status when "Mark as Read" is clicked', async () => {
    renderLinkCard();
    const moreButton = screen.getByRole("button", { name: /more/i });
    await userEvent.click(moreButton);

    const dropdownMenu = screen.getByRole("menu");
    const markAsReadButton = within(dropdownMenu).getByText("Mark as Read");
    await userEvent.click(markAsReadButton);

    expect(mockedToast).toHaveBeenCalled();
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it("shows delete confirmation dialog when delete is clicked", async () => {
    renderLinkCard();
    const moreButton = screen.getByRole("button", { name: /more/i });
    await userEvent.click(moreButton);

    const dropdownMenu = screen.getByRole("menu");
    const deleteButton = within(dropdownMenu).getByText("Delete");
    await userEvent.click(deleteButton);

    expect(await screen.findByText("Are you sure?")).toBeInTheDocument();
  });

  it("deletes link when confirmed in delete dialog", async () => {
    renderLinkCard();
    const moreButton = screen.getByRole("button", { name: /more/i });
    await userEvent.click(moreButton);

    const dropdownMenu = screen.getByRole("menu");
    const deleteButton = within(dropdownMenu).getByText("Delete");
    await userEvent.click(deleteButton);

    const confirmDeleteButton = screen.getByTestId("delete-confirm-button");
    await userEvent.click(confirmDeleteButton);

    expect(mockedToast).toHaveBeenCalled();
    expect(mockOnUpdate).toHaveBeenCalled();
  });
});
