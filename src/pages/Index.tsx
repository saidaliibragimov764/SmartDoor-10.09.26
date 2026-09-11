import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppProvider, useAppState } from "@/context/AppContext";
import { getApiBaseUrl } from "@/admin/adminAuth";
import BottomNav from "@/components/BottomNav";
import HomePage from "@/pages/HomePage";
import FavoritesPage from "@/pages/FavoritesPage";
import CartPage from "@/pages/CartPage";
import ProfilePage from "@/pages/ProfilePage";
import ProductDetail from "@/pages/ProductDetail";
import ReceiptPage from "@/pages/ReceiptPage";
import WelcomeDialog from "@/components/WelcomeDialog";
import { DoorProduct, Order } from "@/data/products";

function AppContent() {
  const { cart } = useAppState();
  const [tab, setTab] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState<DoorProduct | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [profileClicks, setProfileClicks] = useState(0);
  const navigate = useNavigate();

  const handleNavigate = (nextTab: string) => {
    if (nextTab === "profile") {
      setProfileClicks((prev) => {
        const next = prev + 1;
        if (next >= 10) {
          navigate("/admin");
          return 0;
        }
        return next;
      });
    } else {
      setProfileClicks(0);
    }
    setTab(nextTab);
  };

  if (completedOrder) {
    return (
      <ReceiptPage
        order={completedOrder}
        onBack={() => {
          setCompletedOrder(null);
          setTab("profile");
        }}
      />
    );
  }

  if (selectedProduct) {
    return (
      <ProductDetail
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <WelcomeDialog />
      {tab === "home" && <HomePage onSelectProduct={setSelectedProduct} />}
      {tab === "favorites" && <FavoritesPage onSelectProduct={setSelectedProduct} />}
      {tab === "cart" && <CartPage onOrderComplete={setCompletedOrder} />}
      {tab === "profile" && <ProfilePage />}
      <BottomNav active={tab} onNavigate={handleNavigate} cartCount={cart.length} />
    </div>
  );
}

export default function Index() {
  useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/public/products`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.products)) {
          localStorage.setItem("smartdoor_admin_products", JSON.stringify(data.products));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
