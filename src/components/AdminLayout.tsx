import {
  LayoutDashboard,
  Package,
  Users,
  RotateCcw,
  FileText,
  Settings,
  Truck,
  Moon,
  Sun,
  LogOut,
  Menu,
  Bell,
  MapPin,
  Route,
  BarChart3,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  userEmail: string;
}

export function AdminLayout({
  children,
  currentPage,
  onNavigate,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
  userEmail,
}: AdminLayoutProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "deliveries", label: "Deliveries", icon: Package },
    { id: "drivers", label: "Drivers", icon: Users },
    { id: "tracking", label: "Live Tracking", icon: MapPin },
    { id: "routes", label: "Route Optimization", icon: Route },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "returns", label: "Returns", icon: RotateCcw, badge: 3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#27AE60] flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div className="hidden lg:block">
            <h2 className="text-[#222B2D] dark:text-white">SmartStock</h2>
            <p className="text-xs text-[#222B2D]/60 dark:text-white/60">Logistics</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-[#27AE60] text-white"
                  : "text-[#222B2D]/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm lg:text-base">{item.label}</span>
              {item.badge && (
                <Badge
                  variant="destructive"
                  className="ml-auto hidden sm:flex"
                >
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[#F6F7F8] dark:bg-[#222B2D]">
        {/* Desktop Sidebar */}
        <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-20 lg:w-64 md:flex-col bg-white dark:bg-[#1a2123] border-r border-gray-200 dark:border-gray-700 z-20">
          <SidebarContent />
        </aside>



        {/* Main Content */}
        <div className="md:pl-20 lg:pl-64">
          {/* Top Bar */}
          <header className="sticky top-0 z-10 bg-white dark:bg-[#1a2123] border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3">
              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 sm:w-64 p-0">
                  <SidebarContent />
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2 ml-auto">
                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="w-5 h-5" />
                      <span className="absolute top-1 right-1 w-2 h-2 bg-[#27AE60] rounded-full"></span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="p-4 border-b">
                      <h3>Notifications</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="text-sm">
                        <p className="text-[#222B2D] dark:text-white">
                          New delivery assigned
                        </p>
                        <p className="text-[#222B2D]/60 dark:text-white/60 text-xs">
                          5 minutes ago
                        </p>
                      </div>
                      <div className="text-sm">
                        <p className="text-[#222B2D] dark:text-white">
                          Return request received
                        </p>
                        <p className="text-[#222B2D]/60 dark:text-white/60 text-xs">
                          1 hour ago
                        </p>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Dark Mode Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleDarkMode}
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </Button>

                {/* Logout */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onLogout}
                  className="text-red-600"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}