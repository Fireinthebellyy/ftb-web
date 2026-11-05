import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InstallBanner from "./InstallBanner";

const mockUseInstallBanner = vi.fn();
const mockUseReducedMotion = vi.fn(() => false);

vi.mock("@/hooks/use-install-banner", () => ({
  useInstallBanner: () => mockUseInstallBanner(),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/opportunities" }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { alt: string; src: string }) => <img alt={props.alt} src={props.src} />,
}));
vi.mock("framer-motion", async () => {
  const React = await import("react");
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useReducedMotion: () => mockUseReducedMotion(),
    motion: {
      section: ({
        children,
        initial: _i,
        animate: _a,
        exit: _e,
        transition: _t,
        ...rest
      }: Record<string, unknown> & { children: React.ReactNode }) => (
        <section {...(rest as React.HTMLAttributes<HTMLElement>)}>{children}</section>
      ),
    },
  };
});

describe("InstallBanner", () => {
  const install = vi.fn();
  const dismiss = vi.fn();

  beforeEach(() => {
    install.mockReset();
    dismiss.mockReset();
  });

  it("renders nothing when not visible", () => {
    mockUseInstallBanner.mockReturnValue({ isVisible: false, mode: "native", install, dismiss });
    const { container } = render(<InstallBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for unsupported mode", () => {
    mockUseInstallBanner.mockReturnValue({ isVisible: true, mode: "none", install, dismiss });
    const { container } = render(<InstallBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders copy and calls install / dismiss", () => {
    mockUseInstallBanner.mockReturnValue({ isVisible: true, mode: "native", install, dismiss });
    render(<InstallBanner />);

    expect(screen.getByText("SHORTCUT · NO APP STORE")).toBeTruthy();
    expect(screen.getByText("Install FTB")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Install" }));
    expect(install).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Dismiss install banner" }));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("dismisses on Escape", () => {
    mockUseInstallBanner.mockReturnValue({ isVisible: true, mode: "native", install, dismiss });
    render(<InstallBanner />);
    fireEvent.keyDown(screen.getByRole("region", { name: "Install app" }), { key: "Escape" });
    expect(dismiss).toHaveBeenCalled();
  });

  it("shows Share → Add to Home Screen steps on iOS", () => {
    mockUseInstallBanner.mockReturnValue({ isVisible: true, mode: "ios", install, dismiss });
    render(<InstallBanner />);

    fireEvent.click(screen.getByRole("button", { name: "Install" }));
    expect(screen.getByText("Add to Home Screen")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Install" })).toBeNull();
  });

  it("renders with reduced motion enabled", () => {
    mockUseReducedMotion.mockReturnValueOnce(true);
    mockUseInstallBanner.mockReturnValue({ isVisible: true, mode: "native", install, dismiss });
    render(<InstallBanner />);
    expect(screen.getByRole("region", { name: "Install app" })).toBeTruthy();
  });
});