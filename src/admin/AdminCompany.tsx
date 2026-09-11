import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Building2, UserPlus, Camera } from "lucide-react";
import {
  AdminSession,
  getApiBaseUrl,
  getAuthHeaders,
  registerStaffAccount,
  removeStaffAccount,
} from "./adminAuth";
import AdminChatPanel from "./AdminChatPanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CompanyResponse {
  company: { name: string; logoDataUrl?: string };
  members: Array<{
    username: string;
    displayName: string;
    role: "super_admin" | "staff";
    telegram?: string;
    phone?: string;
  }>;
}

export default function AdminCompany({ session }: { session: AdminSession }) {
  const [companyName, setCompanyName] = useState<string>("");
  const [companyLogo, setCompanyLogo] = useState<string>("");
  const [members, setMembers] = useState<CompanyResponse["members"]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const canManage = session.role === "super_admin";
  const [companyLoading, setCompanyLoading] = useState(false);

  const migrateLegacyLocalData = async (currentCompanyName: string) => {
    if (!canManage) return;
    const raw = localStorage.getItem("smartdoor_company");
    if (!raw) return;
    try {
      const legacy = JSON.parse(raw) as {
        name?: string;
        admins?: Array<{
          firstName?: string;
          lastName?: string;
          telegram?: string;
          phone?: string;
          login?: string;
          password?: string;
        }>;
      };

      if (legacy?.name?.trim() && !currentCompanyName?.trim()) {
        await fetch(`${getApiBaseUrl()}/api/company/name`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ name: legacy.name.trim() }),
        }).catch(() => {});
      }

      if (Array.isArray(legacy.admins)) {
        for (const a of legacy.admins) {
          const login = String(a.login || "").trim().toLowerCase();
          const password = String(a.password || "").trim();
          if (!login || !password) continue;
          await registerStaffAccount({
            username: login,
            password,
            displayName: `${String(a.firstName || "").trim()} ${String(
              a.lastName || ""
            ).trim()}`.trim(),
            telegram: String(a.telegram || "").trim(),
            phone: String(a.phone || "").trim(),
          });
        }
      }
    } catch {
      // ignore invalid legacy data
    }
  };

  const loadCompany = () => {
    setCompanyLoading(true);
    fetch(`${getApiBaseUrl()}/api/company`, { headers: { ...getAuthHeaders() } })
      .then((r) => r.json())
      .then(async (data: CompanyResponse) => {
        setCompanyName(String(data?.company?.name || ""));
        setCompanyLogo(String(data?.company?.logoDataUrl || ""));
        setMembers(Array.isArray(data?.members) ? data.members : []);
        await migrateLegacyLocalData(String(data?.company?.name || ""));
      })
      .catch(() => {
        // keep previous values
      })
      .finally(() => setCompanyLoading(false));
  };

  useEffect(() => {
    loadCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const saveName = () => {
    const name = nameInput.trim();
    if (!name) return;
    fetch(`${getApiBaseUrl()}/api/company/name`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ name }),
    })
      .then((r) => r.json())
      .then(() => {
        setEditingName(false);
        loadCompany();
      })
      .catch(() => {
        window.alert("Backend bilan aloqa yo'q");
      });
  };

  const addAdmin = async (admin: {
    firstName: string;
    lastName: string;
    telegram: string;
    phone: string;
    login: string;
    password: string;
  }) => {
    const created = await registerStaffAccount({
      username: admin.login,
      password: admin.password,
      displayName: `${admin.firstName} ${admin.lastName}`,
      telegram: admin.telegram,
      phone: admin.phone,
    });
    if (!created.ok) {
      window.alert(created.message);
      return;
    }
    setShowAddAdmin(false);
    loadCompany();
  };

  const removeAdmin = async (username: string) => {
    const u = String(username || "").trim().toLowerCase();
    if (u === "superadmin") {
        window.alert("Bosh adminni o'chirib bo'lmaydi");
        return;
    }
    const removed = await removeStaffAccount(u);
    if (!removed.ok) {
      window.alert(removed.message);
      return;
    }
    loadCompany();
  };

  const logoLetter =
    companyName.trim().charAt(0).toUpperCase() ||
    (companyLoading ? "" : "?");

  const uploadLogoFromFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const logoDataUrl = String(reader.result || "");
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/company/logo`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ logoDataUrl }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          window.alert(data?.message || "Logo saqlanmadi");
          return;
        }
        loadCompany();
      } catch {
        window.alert("Backend bilan aloqa yo'q");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col lg:flex-row items-start gap-6">
      <div className="flex-1 w-full space-y-6">
      {/* Logo hero — gradient circle like avatar (or uploaded image) */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <div className="relative">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt=""
              className="h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover border-4 border-primary/25 shadow-xl ring-2 ring-primary/15"
            />
          ) : (
            <div
              className={cn(
                "h-28 w-28 sm:h-32 sm:w-32 rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-[#ff9a8b] via-[#ff7b6b] to-[#e84c3d]",
                "border-4 border-white/10 shadow-xl text-white font-semibold text-4xl sm:text-5xl tracking-tight select-none"
              )}
              aria-hidden
            >
              {logoLetter}
            </div>
          )}
          {canManage && (
            <label className="absolute bottom-0 right-0 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadLogoFromFile(file);
                  e.target.value = "";
                }}
              />
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg border-2 border-background hover:opacity-90 transition-opacity">
                <Camera className="h-4 w-4" />
              </span>
            </label>
          )}
        </div>
        <p className="font-display text-lg font-semibold text-foreground text-center">
          {companyLoading ? "..." : companyName || "Kompaniya"}
        </p>
        {canManage && companyLogo && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={async () => {
              await fetch(`${getApiBaseUrl()}/api/company/logo`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                body: JSON.stringify({ logoDataUrl: "" }),
              }).catch(() => {});
              loadCompany();
            }}
          >
            Logoni olib tashlash
          </Button>
        )}
      </div>

      {/* Company Name */}
      <Card className="luxury-card">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="font-display text-base font-semibold text-foreground">Kompaniya nomi</h3>
          </div>
          {editingName && canManage ? (
            <div className="flex gap-2">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Kompaniya nomini kiriting"
                className="bg-secondary border-border flex-1"
              />
              <Button size="sm" className="gold-gradient text-primary-foreground" onClick={saveName}>Saqlash</Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => {
                  setEditingName(false);
                  setNameInput(companyName);
                }}
              >
                Bekor
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-foreground text-sm">
                {companyLoading ? (
                  <span className="text-muted-foreground italic">Yuklanmoqda...</span>
                ) : companyName ? (
                  companyName
                ) : (
                  <span className="text-muted-foreground italic">Nom kiritilmagan</span>
                )}
              </p>
              {canManage && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary h-8 w-8"
                    onClick={() => {
                      setEditingName(true);
                      setNameInput(companyName);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members (real from backend) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            A'zolar
          </h3>
          {canManage && (
            <Button
              size="sm"
              className="gold-gradient text-primary-foreground"
              onClick={() => setShowAddAdmin(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Admin qo'shish
            </Button>
          )}
        </div>

        {members.length === 0 ? (
          <Card className="luxury-card">
            <CardContent className="p-8 text-center">
              <UserPlus className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Hozircha a'zo yo'q.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {members.map((m) => (
              <Card key={m.username} className="luxury-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-foreground">
                        {m.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{m.username} • {m.role === "super_admin" ? "Bosh admin" : "Xodim"}
                      </p>
                      {(m.telegram || m.phone) && (
                        <p className="text-xs text-muted-foreground">
                          {m.telegram ? `@${m.telegram}` : ""}{m.telegram && m.phone ? " • " : ""}{m.phone || ""}
                        </p>
                      )}
                    </div>
                    {canManage && m.role !== "super_admin" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-8 w-8 shrink-0"
                        onClick={() => removeAdmin(m.username)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Admin Dialog */}
      {canManage && (
        <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
          <DialogContent className="bg-card border-border max-w-md">
            <AddAdminForm onSave={addAdmin} onCancel={() => setShowAddAdmin(false)} />
          </DialogContent>
        </Dialog>
      )}
      </div>

      <AdminChatPanel className="flex w-full lg:w-[300px] lg:sticky lg:top-16" />
    </div>
  );
}

function AddAdminForm({
  onSave,
  onCancel,
}: {
  onSave: (a: {
    firstName: string;
    lastName: string;
    telegram: string;
    phone: string;
    login: string;
    password: string;
  }) => void;
  onCancel: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [phone, setPhone] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const canSave = firstName.trim() && lastName.trim() && login.trim() && password.trim();

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display gold-text">Admin qo'shish</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 text-sm">
        <div>
          <label className="text-xs text-muted-foreground">Ism</label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ism" className="bg-secondary border-border mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Familiya</label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Familiya" className="bg-secondary border-border mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Telegram username</label>
          <Input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="username" className="bg-secondary border-border mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Telefon raqam</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" className="bg-secondary border-border mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Login</label>
          <Input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="xodim.login" className="bg-secondary border-border mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Parol</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parol" className="bg-secondary border-border mt-1" />
        </div>
        <div className="flex gap-2 pt-2">
          <Button className="gold-gradient text-primary-foreground flex-1" disabled={!canSave} onClick={() => onSave({ firstName, lastName, telegram, phone, login, password })}>
            Qo'shish
          </Button>
          <Button variant="ghost" className="text-muted-foreground" onClick={onCancel}>Bekor</Button>
        </div>
      </div>
    </>
  );
}
