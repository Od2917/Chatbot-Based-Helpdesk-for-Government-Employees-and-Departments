import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="flex items-center gap-6 flex-1">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-saffron to-gold flex items-center justify-center shadow-md">
          <span className="text-saffron-foreground font-bold text-sm">M</span>
        </div>
        <div>
          <h1 className="font-semibold text-lg gradient-text-indian">MHA Assistant</h1>
          <Badge variant="secondary" className="text-xs bg-indian-green-light text-indian-green border-indian-green/20">
            Government Helpdesk
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-auto">
        <Button
          asChild
          variant={isActive("/") ? "default" : "ghost"}
          size="sm"
          className={cn(
            "transition-all duration-200",
            isActive("/") && "bg-primary text-primary-foreground shadow-md"
          )}
        >
          <Link to="/">Chat</Link>
        </Button>
        <Button
          asChild
          variant={isActive("/about") ? "default" : "ghost"}
          size="sm"
          className={cn(
            "transition-all duration-200",
            isActive("/about") && "bg-primary text-primary-foreground shadow-md"
          )}
        >
          <Link to="/about">About</Link>
        </Button>
      </div>
    </nav>
  );
};