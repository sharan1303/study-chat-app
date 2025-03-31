"use client";

import * as React from "react";

// Constants
const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

// Types
type SidebarContext = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

// Create context with default values
const SidebarContext = React.createContext<SidebarContext>({
  state: "expanded",
  open: true,
  setOpen: () => {},
  openMobile: false,
  setOpenMobile: () => {},
  isMobile: false,
  toggleSidebar: () => {},
});

// Custom hook to use sidebar with type safety
export function useSidebar() {
  return React.useContext(SidebarContext);
}

// Optimized mobile detection hook
export function useIsMobile() {
  // Initialize with a check for window only at runtime
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Use a more performant approach with addEventListener
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

// Helper to get saved sidebar state from cookie
function getSavedSidebarState(defaultOpen: boolean): boolean {
  if (typeof document === "undefined") return defaultOpen;

  const cookies = document.cookie.split(";");
  const sidebarCookie = cookies.find((cookie) =>
    cookie.trim().startsWith(`${SIDEBAR_COOKIE_NAME}=`)
  );

  if (sidebarCookie) {
    const value = sidebarCookie.split("=")[1];
    return value === "true";
  }

  return defaultOpen;
}

// Provider component
export const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);

    // Get initial state from cookie when component mounts
    const [_open, _setOpen] = React.useState(() =>
      getSavedSidebarState(defaultOpen)
    );

    // This is the internal state of the sidebar.
    // Use openProp and setOpenProp for control from outside
    const open = openProp ?? _open;

    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }

        // Persist state in cookie
        if (typeof document !== "undefined") {
          document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        }
      },
      [setOpenProp, open]
    );

    // Helper to toggle the sidebar
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);

    // Keyboard shortcut (Ctrl/Cmd + B)
    React.useEffect(() => {
      if (typeof window === "undefined") return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);

    // We add a state so that we can do data-state="expanded" or "collapsed"
    const state = open ? "expanded" : "collapsed";

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
              ...style,
            } as React.CSSProperties
          }
          className="group/sidebar-wrapper flex min-h-screen w-full"
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  }
);

// Add display name to fix the second linter error
SidebarProvider.displayName = "SidebarProvider";
