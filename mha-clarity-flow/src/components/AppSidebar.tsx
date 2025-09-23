import { BarChart3, Database, FileText, Activity } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { StatsCards } from "./StatsCards";
import { ChunksViewer } from "./ChunksViewer";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-80"}>
      <SidebarHeader className={cn("p-4", collapsed && "p-2")}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-terracotta to-maroon flex items-center justify-center shadow-md">
              <Activity className="w-4 h-4 text-terracotta-light" />
            </div>
            <div>
              <h2 className="font-semibold text-sidebar-foreground">Dashboard</h2>
              <p className="text-xs text-sidebar-foreground/70">System Analytics</p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-4 space-y-6">
        <SidebarGroup>
          <SidebarGroupLabel className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            <BarChart3 className="w-4 h-4" />
            {!collapsed && "Statistics"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <StatsCards collapsed={collapsed} />
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Knowledge Base
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <ChunksViewer />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}