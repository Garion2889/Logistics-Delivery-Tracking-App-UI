import { useState } from "react";
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
import { ConfirmDialog } from "./ConfirmDialog";

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "deliveries", label: "Deliveries", icon: Package },
    { id: "drivers", label: "Drivers", icon: Users },
    { id: "tracking", label: "Live Tracking", icon: MapPin },
    { id: "routes", label: "Route Optimization", icon: Route },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "returns", label: "Returns", icon: RotateCcw },
    //{ id: "settings", label: "Settings", icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#27AE60] flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div className="lg:block">
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
              {/* Mobile Menu - FIXED DARK MODE PORTAL */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden text-[#222B2D] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="left" 
                  className={`w-80 sm:w-64 p-0 ${
                    isDarkMode 
                      ? 'dark bg-[#1a2123] border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}
                  style={{
                    backgroundColor: isDarkMode ? '#1a2123' : '#ffffff',
                    opacity: 1
                  }}
                >
                  <SidebarContent />
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2 ml-auto">

                {/* Dark Mode Toggle - FIXED ICON COLOR */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleDarkMode}
                  className="text-[#222B2D] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
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
                  onClick={() => setShowLogoutConfirm(true)}
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
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

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Confirm Logout"
        description="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={onLogout}
      />
    </div>
  );
}
