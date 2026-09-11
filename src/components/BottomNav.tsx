import { Home, Heart, ShoppingCart, User } from "lucide-react";

interface BottomNavProps {
  active: string;
  onNavigate: (tab: string) => void;
  cartCount: number;
}

const tabs = [
  { id: "home", label: "Asosiy", icon: Home },
  { id: "favorites", label: "Yoqtirilgan", icon: Heart },
  { id: "cart", label: "Savat", icon: ShoppingCart },
  { id: "profile", label: "Kabinet", icon: User },
];

export default function BottomNav({ active, onNavigate, cartCount }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around py-2 px-1 max-w-lg mx-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 relative ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                {tab.id === "cart" && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 gold-gradient text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : ""}`}>{tab.label}</span>
              {isActive && (
                <div className="absolute -bottom-2 w-6 h-[2px] gold-gradient rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
