import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
              <span className="text-muted-foreground">Model loaded · running locally in browser</span>
            </div>
          </header>
          <main className="flex-1 animate-fade-in-slow">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
