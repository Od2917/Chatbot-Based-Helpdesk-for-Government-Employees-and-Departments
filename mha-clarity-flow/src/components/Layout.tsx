import { Outlet } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";

const Layout = () => {
  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-accent/5">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="glass sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-border/50 px-6">
          <SidebarTrigger className="p-2 hover:bg-accent/50 rounded-lg transition-colors" />
          <Navigation />
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;