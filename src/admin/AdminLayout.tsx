import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  CreditCard,
  Settings,
  Menu,
  X,
  Crown,
  Building2,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AdminSession } from "./adminAuth";
import { getApiBaseUrl, getAuthHeaders } from "./adminAuth";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Buyurtmalar", icon: ShoppingBag },
  { id: "customers", label: "Mijozlar", icon: Users },
  { id: "products", label: "Mahsulotlar", icon: Package },
  { id: "payments", label: "To'lovlar", icon: CreditCard },
  { id: "company", label: "Kompaniya", icon: Building2 },
  { id: "groups", label: "Guruhlar", icon: Shield },
  { id: "settings", label: "Sozlamalar", icon: Settings },
];

interface AdminLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  session: AdminSession;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function AdminLayout({
  activeTab,
  onTabChange,
  session,
  onLogout,
  children,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const visibleNavItems =
    session.role === "super_admin"
      ? navItems
      : navItems.filter((i) => i.id !== "groups");
  const [companyLogo, setCompanyLogo] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("SmartDoor");

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/company`, { headers: { ...getAuthHeaders() } })
      .then((r) => r.json())
      .then((data) => {
        setCompanyLogo(String(data?.company?.logoDataUrl || ""));
        const name = String(data?.company?.name || "").trim();
        if (name) setCompanyName(name);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt="Company logo"
                className="h-12 w-12 rounded-full object-cover border border-primary/30 shadow-md"
              />
            ) : (
              <Crown className="h-6 w-6 text-primary" />
            )}
            <div>
              <h1 className="font-display text-lg font-bold gold-text">{companyName}</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {session.role === "super_admin" ? "Admin Panel" : "Xodim Panel"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-muted-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === item.id
                  ? "gold-gradient text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="glass-card rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Logged in as</p>
            <p className="text-sm font-medium text-foreground">{session.displayName}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {session.role === "super_admin" ? "Bosh admin" : "Xodim"}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={onLogout}
            >
              Chiqish
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="font-display text-lg font-semibold text-foreground">
            {visibleNavItems.find((n) => n.id === activeTab)?.label ||
              navItems.find((n) => n.id === activeTab)?.label}
          </h2>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
