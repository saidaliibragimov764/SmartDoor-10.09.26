import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CartItem, DoorConfig, DoorProduct, Order, OrderInfo, calculatePrice } from "@/data/products";

interface AppState {
  favorites: string[];
  cart: CartItem[];
  orders: Order[];
  profile: OrderInfo;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  addToCart: (product: DoorProduct, config: DoorConfig) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  addOrder: (order: Order) => void;
  placeOrder: (customer: OrderInfo) => Order;
  updateProfile: (info: Partial<OrderInfo>) => void;
  profileSetupDone: boolean;
}

const AppContext = createContext<AppState | null>(null);

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("smartdoor_favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("smartdoor_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("smartdoor_orders");
    return saved ? JSON.parse(saved) : [];
  });
  const [profile, setProfile] = useState<OrderInfo>(() => {
    const saved = localStorage.getItem("smartdoor_profile");
    if (saved) return JSON.parse(saved);
    return { fullName: "", phone: "", address: "", district: "", notes: "" };
  });
  const [profileSetupDone, setProfileSetupDone] = useState(() => !!localStorage.getItem("smartdoor_profile"));

  useEffect(() => { localStorage.setItem("smartdoor_favorites", JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem("smartdoor_cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("smartdoor_orders", JSON.stringify(orders)); }, [orders]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const addToCart = useCallback((product: DoorProduct, config: DoorConfig) => {
    const totalPrice = calculatePrice(product, config);
    const item: CartItem = {
      id: Date.now().toString(),
      product,
      config,
      quantity: 1,
      totalPrice,
    };
    setCart(prev => [...prev, item]);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, qty), totalPrice: calculatePrice(i.product, i.config) * Math.max(1, qty) } : i));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, i) => sum + i.totalPrice, 0);

  const addOrder = useCallback((order: Order) => {
    setOrders(prev => [order, ...prev]);
    setCart([]);
  }, []);

  const placeOrder = useCallback((customer: OrderInfo) => {
    const order: Order = {
      code: "SD-" + Date.now().toString().slice(-6),
      items: [...cart],
      customer,
      totalPrice: cart.reduce((s, i) => s + i.totalPrice, 0),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [order, ...prev]);
    setCart([]);
    setProfile(customer);
    return order;
  }, [cart]);

  const updateProfile = useCallback((info: Partial<OrderInfo>) => {
    setProfile(prev => {
      const updated = { ...prev, ...info };
      localStorage.setItem("smartdoor_profile", JSON.stringify(updated));
      return updated;
    });
    setProfileSetupDone(true);
  }, []);

  return (
    <AppContext.Provider value={{
      favorites, cart, orders, profile,
      toggleFavorite, isFavorite, addToCart, removeFromCart,
      updateQuantity, clearCart, cartTotal, addOrder, placeOrder, updateProfile, profileSetupDone,
    }}>
      {children}
    </AppContext.Provider>
  );
}
