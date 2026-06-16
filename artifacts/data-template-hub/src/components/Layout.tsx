import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Database, GitBranch, Activity, Shield, Layers, Zap, AlertTriangle,
  Search, Star, LayoutDashboard, PanelLeft, Sun, Moon, LogOut,
  Settings, Plus, Code2, Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Discover", href: "/", icon: LayoutDashboard },
  { label: "Browse", href: "/browse", icon: Package },
  { label: "Analytics", href: "/analytics", icon: Activity },
];

const categories = [
  { label: "SQL Queries", href: "/browse?category=sql", icon: Database, color: "text-blue-400" },
  { label: "ADF Pipelines", href: "/browse?category=adf", icon: GitBranch, color: "text-orange-400" },
  { label: "Fabric Workflows", href: "/browse?category=fabric", icon: Layers, color: "text-purple-400" },
  { label: "Databricks", href: "/browse?category=databricks", icon: Zap, color: "text-red-400" },
  { label: "GitHub Actions", href: "/browse?category=github-actions", icon: GitBranch, color: "text-emerald-400" },
  { label: "Monitoring", href: "/browse?category=monitoring", icon: Activity, color: "text-cyan-400" },
  { label: "Data Quality", href: "/browse?category=data-quality", icon: Shield, color: "text-green-400" },
  { label: "ETL/ELT", href: "/browse?category=etl-elt", icon: Layers, color: "text-yellow-400" },
  { label: "CI/CD", href: "/browse?category=cicd", icon: GitBranch, color: "text-pink-400" },
  { label: "Spark Jobs", href: "/browse?category=spark", icon: Zap, color: "text-orange-300" },
  { label: "Incident Response", href: "/browse?category=incident-response", icon: AlertTriangle, color: "text-red-300" },
];

function NavLink({ href, icon: Icon, label, open }: { href: string; icon: any; label: string; open: boolean }) {
  const [location] = useLocation();
  const active = location === href;
  return (
    <Link href={href} className={cn(
      "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors cursor-pointer",
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        : "text-sidebar-foreground hover:bg-sidebar-accent/60"
    )}>
      <Icon className="w-4 h-4 shrink-0" />
      {open && <span className="truncate">{label}</span>}
    </Link>
  );
}

function CatLink({ href, icon: Icon, label, color, open }: { href: string; icon: any; label: string; color: string; open: boolean }) {
  return (
    <Link href={href} className={cn(
      "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer",
      "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
    )}>
      <Icon className={cn("w-3.5 h-3.5 shrink-0", color)} />
      {open && <span className="truncate">{label}</span>}
    </Link>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/browse?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 shrink-0",
        sidebarOpen ? "w-56" : "w-14"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 py-4 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shrink-0">
            <Code2 className="w-4 h-4 text-primary-foreground" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-sidebar-foreground truncate">DataHub</p>
              <p className="text-[10px] text-muted-foreground truncate">Template Marketplace</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-1.5">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} open={sidebarOpen} />
          ))}

          {isAuthenticated && (
            <NavLink href="/favorites" icon={Star} label="Favorites" open={sidebarOpen} />
          )}

          {user?.role === "admin" && (
            <NavLink href="/admin" icon={Settings} label="Admin" open={sidebarOpen} />
          )}

          {sidebarOpen && (
            <div className="pt-3 pb-1 px-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Categories</p>
            </div>
          )}
          {categories.map((cat) => (
            <CatLink key={cat.href} href={cat.href} icon={cat.icon} label={cat.label} color={cat.color} open={sidebarOpen} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center w-full p-1.5 rounded-md text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
          >
            <PanelLeft className={cn("w-4 h-4 transition-transform", !sidebarOpen && "rotate-180")} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-12 border-b border-border flex items-center gap-3 px-4 bg-background/95 backdrop-blur shrink-0">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-7 text-xs bg-muted/50 border-muted focus-visible:ring-1"
              />
            </div>
          </form>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated && (
              <Link href="/submit">
                <Button size="sm" className="h-7 text-xs gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Submit
                </Button>
              </Link>
            )}

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-foreground hidden sm:block">{user.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/favorites" className="flex items-center gap-2 cursor-pointer">
                      <Star className="w-3.5 h-3.5" />Favorites
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="w-3.5 h-3.5" />Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                    <LogOut className="w-3.5 h-3.5 mr-2" />Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">Login</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="h-7 text-xs">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
