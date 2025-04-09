import * as React from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/sidebar-context";
import { getOSModifierKey, SHORTCUTS } from "./ClientSidebar";

// For mobile we'll need a sliding sheet component
import { Sheet, SheetContent, SheetTitle } from "../ui/sheet";
import { PanelLeft, Edit } from "lucide-react";

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    // Fixed sidebar (non-collapsible)
    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-background",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      );
    }

    // Mobile implementation using a sliding sheet
    if (isMobile) {
      return (
        <>
          {/* Fixed mobile trigger that's always visible when sheet is closed */}
          {!openMobile && (
            <div
              className="fixed left-[0.75rem] top-3 z-[100] flex items-center bg-[hsl(var(--sidebar-background))] rounded-md gap-1 shadow-md"
              data-sidebar="mobile-trigger-fixed"
              style={{ pointerEvents: "auto" }}
            >
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => setOpenMobile(true)}
                aria-label="Open Sidebar"
                title="Open Sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => (window.location.href = "/chat")}
                aria-label="New Chat"
                title="New Chat"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
          )}

          <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
            <SheetContent
              data-sidebar="sidebar"
              data-mobile="true"
              className="w-[--sidebar-width-mobile] bg-background p-0"
              side={side}
            >
              <SheetTitle className="sr-only">Sidebar Navigation</SheetTitle>
              <div className="flex h-full w-full flex-col">{children}</div>
            </SheetContent>
          </Sheet>
        </>
      );
    }

    // Desktop implementation with animations
    return (
      <div
        ref={ref}
        className="group peer hidden md:block"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/* This handles the sidebar gap on desktop */}
        <div
          className={cn(
            "duration-200 relative h-screen w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_1rem)]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
          )}
        />
        <div
          className={cn(
            "duration-200 fixed inset-y-0 z-10 hidden h-screen w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            // Adjust the padding for floating and inset variants
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_1rem_+2px)]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className={cn(
              "flex h-full w-full flex-col bg-[hsl(var(--sidebar-background))] group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow",
              className
            )}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);

Sidebar.displayName = "Sidebar";

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar, state, isMobile, setOpenMobile } = useSidebar();
  const [modifierKey, setModifierKey] = React.useState("⌘");

  React.useEffect(() => {
    // Set the modifier key based on OS
    setModifierKey(getOSModifierKey());
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (isMobile) {
      setOpenMobile(true);
    } else {
      toggleSidebar();
    }
  };

  return (
    <button
      ref={ref}
      data-sidebar="trigger"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        state === "collapsed" ? "mx-auto" : "",
        className
      )}
      title={
        state === "expanded"
          ? `Collapse Sidebar (${modifierKey}+${SHORTCUTS.TOGGLE_SIDEBAR})`
          : `Expand Sidebar (${modifierKey}+${SHORTCUTS.TOGGLE_SIDEBAR})`
      }
      onClick={handleClick}
      {...props}
    >
      <PanelLeft className="h-4 w-4" />
      <span className="sr-only">
        {state === "expanded" ? "Collapse" : "Expand"} Sidebar
      </span>
    </button>
  );
});

SidebarTrigger.displayName = "SidebarTrigger";

export const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar, state } = useSidebar();
  const [modifierKey, setModifierKey] = React.useState("⌘");

  React.useEffect(() => {
    // Set the modifier key based on OS
    setModifierKey(getOSModifierKey());
  }, []);

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title={`Toggle Sidebar (${modifierKey}+${SHORTCUTS.TOGGLE_SIDEBAR})`}
      className={cn(
        "absolute inset-y-0 z-20 w-4 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-border group-data-[side=left]:right-0 group-data-[side=right]:left-0",
        "cursor-pointer",
        state === "collapsed" ? "translate-x-0 flex" : "hidden",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-accent/30",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  );
});

SidebarRail.displayName = "SidebarRail";

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
});

SidebarHeader.displayName = "SidebarHeader";

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-2 group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  );
});

SidebarContent.displayName = "SidebarContent";

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-4 border-t", className)}
      {...props}
    />
  );
});

SidebarFooter.displayName = "SidebarFooter";
