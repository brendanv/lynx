import { render, screen } from "@/test-utils";
import { vi, describe, it, expect, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthOnly as LynxLoggedInPage } from "@/pages/LynxLoggedInPage";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Outlet: vi.fn(() => <div data-testid="outlet" />),
    useOutletContext: vi.fn(),
  };
});

let validLogin = false;

vi.mock("pocketbase", () => {
  return {
    default: vi.fn(() => ({
      authStore: {
        model: validLogin ? { id: "user123" } : null,
        isValid: validLogin,
        onChange: vi.fn(),
      },
    })),
  };
});

// Create a wrapper component
const TestWrapper = ({ children }: any) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe("LynxLoggedInPage", () => {
  afterEach(() => {
    validLogin = false;
  });

  it("does not render the outlet if not logged in", async () => {
    render(
      <TestWrapper>
        <LynxLoggedInPage>
          <span data-testid="protected-content" />
        </LynxLoggedInPage>
      </TestWrapper>,
    );

    const outlet = screen.queryByTestId("protected-content");
    expect(outlet).toBeNull();
  });

  it("renders the outlet if logged in", async () => {
    validLogin = true;
    render(
      <TestWrapper>
        <LynxLoggedInPage>
          <span data-testid="protected-content" />
        </LynxLoggedInPage>
      </TestWrapper>,
    );

    const outlet = screen.queryByTestId("protected-content");
    expect(outlet).not.toBeNull();
  });
});
