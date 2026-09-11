import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import AdminDashboard from "./AdminDashboard";
import AdminOrders from "./AdminOrders";
import AdminCustomers from "./AdminCustomers";
import AdminProducts from "./AdminProducts";
import AdminPayments from "./AdminPayments";
import AdminSettings from "./AdminSettings";
import AdminCompany from "./AdminCompany";
import AdminGroupManagement from "./AdminGroupManagement";
import { AdminOrder, AdminCustomer } from "@/data/adminData";
import {
  AdminSession,
  AdminLoginLog,
  clearAdminSession,
  fetchAdminMe,
  fetchServerLoginLogs,
  getAdminSession,
  getAuthHeaders,
  getApiBaseUrl,
} from "./adminAuth";
import { Card, CardContent } from "@/components/ui/card";
import AdminLoginForm from "./AdminLoginForm";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const [tab, setTab] = useState("dashboard");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [session, setSession] = useState<AdminSession | null>(getAdminSession);
  const navigate = useNavigate();

  const updateOrder = async (id: string, updates: Partial<AdminOrder>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
    try {
      await fetch(`${getApiBaseUrl()}/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(updates),
      });
      // reload to sync customer spent / ordersCount stats
      const [ordersRes, customersRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/api/orders`, { headers: { ...getAuthHeaders() } }),
        fetch(`${getApiBaseUrl()}/api/customers`, { headers: { ...getAuthHeaders() } })
      ]);
      const ordersJson = await ordersRes.json() as { orders?: AdminOrder[] };
      const customersJson = await customersRes.json() as { customers?: AdminCustomer[] };
      if (Array.isArray(ordersJson.orders)) setOrders(ordersJson.orders);
      if (Array.isArray(customersJson.customers)) setCustomers(customersJson.customers);
    } catch (err) {
      console.error("Failed to update order on server:", err);
    }
  };

  const canManageAdmins = session?.role === "super_admin";
  const [loginLogs, setLoginLogs] = useState<AdminLoginLog[]>([]);
  const [allGroupIds, setAllGroupIds] = useState<string[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<string[]>([]);

  useEffect(() => {
    if (!session) return;
    if (session.role !== "super_admin" && tab === "groups") {
      setTab("company");
    }
  }, [session, tab]);

  useEffect(() => {
    if (!session) return;
    fetchAdminMe().then((result) => {
      if (result.ok) {
        setSession(result.session);
      } else if (result.unauthorized) {
        clearAdminSession();
        setSession(null);
        navigate("/");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!session) return;
    const fetchOrdersAndCustomers = async () => {
      try {
        const [ordersRes, customersRes] = await Promise.all([
          fetch(`${getApiBaseUrl()}/api/orders`, { headers: { ...getAuthHeaders() } }),
          fetch(`${getApiBaseUrl()}/api/customers`, { headers: { ...getAuthHeaders() } })
        ]);
        const ordersJson = await ordersRes.json() as { orders?: AdminOrder[] };
        const customersJson = await customersRes.json() as { customers?: AdminCustomer[] };
        if (Array.isArray(ordersJson.orders)) setOrders(ordersJson.orders);
        if (Array.isArray(customersJson.customers)) setCustomers(customersJson.customers);
      } catch (err) {
        console.error("Failed to load orders/customers:", err);
      }
    };
    fetchOrdersAndCustomers();
  }, [session]);

  useEffect(() => {
    if (!session) return;
    if (session.role === "super_admin") return;

    const run = async () => {
      try {
        const [listRes, myRes] = await Promise.all([
          fetch(`${getApiBaseUrl()}/api/groups/list`, { headers: { ...getAuthHeaders() } }),
          fetch(`${getApiBaseUrl()}/api/groups/my`, { headers: { ...getAuthHeaders() } }),
        ]);
        const listJson = (await listRes.json()) as { groups?: Array<{ id: string; name: string }> };
        const myJson = (await myRes.json()) as { groupIds?: string[] };

        const groupIds = Array.isArray(listJson.groups) ? listJson.groups.map((g) => g.id) : [];
        const myIds = Array.isArray(myJson.groupIds) ? myJson.groupIds : [];
        setAllGroupIds(groupIds);
        setMyGroupIds(myIds);
      } catch {
        setAllGroupIds([]);
        setMyGroupIds([]);
      }
    };

    void run();
  }, [session]);

  const visibleOrders = orders;
  const visibleCustomers = customers;

  useEffect(() => {
    if (!session || !canManageAdmins) return;
    fetchServerLoginLogs().then((result) => {
      if (result.ok) setLoginLogs(result.logs.slice(0, 20));
    });
  }, [session, canManageAdmins]);

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="luxury-card w-full max-w-md">
          <CardContent className="p-6">
            <AdminLoginForm onSuccess={setSession} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AdminLayout
      activeTab={tab}
      onTabChange={(next) => {
        if (session.role !== "super_admin" && next === "groups") return;
        setTab(next);
      }}
      session={session}
      onLogout={() => {
        clearAdminSession();
        setSession(null);
        navigate("/");
      }}
    >
      {tab === "dashboard" && <AdminDashboard orders={visibleOrders} />}
      {tab === "orders" && <AdminOrders orders={visibleOrders} onUpdateOrder={updateOrder} />}
      {tab === "customers" && <AdminCustomers customers={visibleCustomers} />}
      {tab === "products" && <AdminProducts session={session} />}
      {tab === "payments" && <AdminPayments orders={visibleOrders} />}
      {tab === "company" && <AdminCompany session={session} />}
      {tab === "groups" && session.role === "super_admin" && (
        <AdminGroupManagement canManage={canManageAdmins} />
      )}
      {tab === "settings" && (
        <div className="space-y-4">
          <AdminSettings session={session} canManageAdmins={canManageAdmins} />
          {canManageAdmins ? (
            <Card className="luxury-card">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-display text-base font-semibold gold-text">
                    Kirish tarixi (IP bilan)
                  </h4>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    Bosh admin
                  </Badge>
                </div>
                <div className="space-y-2 text-xs">
                  {loginLogs.length === 0 && (
                    <p className="text-muted-foreground">Kirish loglari hali yo'q.</p>
                  )}
                  {loginLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-md border border-border bg-secondary/40 px-3 py-2"
                    >
                      <p className="text-foreground">
                        {log.username} ({log.role === "super_admin" ? "bosh admin" : "xodim"})
                      </p>
                      <p className="text-muted-foreground">
                        IP: {log.ip} | {new Date(log.at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="luxury-card">
              <CardContent className="p-4 text-sm text-muted-foreground">
                Kirish loglarini faqat bosh admin ko'ra oladi.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
