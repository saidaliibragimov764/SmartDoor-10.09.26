import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  ArrowLeft,
  UserPlus,
  Crown,
  FolderOpen,
  ArrowRightLeft,
  Shield,
} from "lucide-react";
import {
  AdminGroup,
  AdminUser,
  GroupsState,
  loadGroupsState,
  saveGroupsState,
} from "./adminGroupsData";
import {
  getApiBaseUrl,
  getAuthHeaders,
  registerStaffAccount,
  removeStaffAccount,
} from "./adminAuth";

export default function AdminGroupManagement({ canManage }: { canManage: boolean }) {
  const [state, setState] = useState<GroupsState>(loadGroupsState);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AdminGroup | null>(null);
  const [showMoveUser, setShowMoveUser] = useState<AdminUser | null>(null);
  const [unassignedStaff, setUnassignedStaff] = useState<Array<{ username: string; displayName: string; telegram?: string; phone?: string; role: string }>>([]);

  useEffect(() => {
    // load from backend first (source of truth)
    if (!canManage) return;
    fetch(`${getApiBaseUrl()}/api/groups/state`, { headers: { ...getAuthHeaders() } })
      .then((r) => r.json())
      .then((data) => {
        if (data?.state?.groups && data?.state?.users) {
          setState(data.state as GroupsState);
        }
      })
      .catch(() => {
        // fallback: keep local state
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  useEffect(() => {
    if (!canManage) return;
    fetch(`${getApiBaseUrl()}/api/company`, { headers: { ...getAuthHeaders() } })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.members)) {
          setUnassignedStaff(data.members.filter((m: { username: string; displayName: string; telegram?: string; phone?: string; role: string }) => m.role === "staff"));
        }
      })
      .catch(() => {});
  }, [canManage, state]);

  useEffect(() => {
    saveGroupsState(state);
    if (!canManage) return;
    fetch(`${getApiBaseUrl()}/api/groups/state`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(state),
    }).catch(() => {
      // keep local-only if backend unreachable
    });
  }, [state, canManage]);

  const createGroup = (name: string) => {
    if (!canManage) return;
    const newGroup: AdminGroup = { id: Date.now().toString(), name };
    setState((prev) => ({ ...prev, groups: [...prev.groups, newGroup] }));
    setShowCreateGroup(false);
  };

  const updateGroupName = (id: string, name: string) => {
    if (!canManage) return;
    setState((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === id ? { ...g, name } : g)),
    }));
    setEditingGroup(null);
  };

  const deleteGroup = (id: string) => {
    if (!canManage) return;
    setState((prev) => ({
      groups: prev.groups.filter((g) => g.id !== id),
      users: prev.users.filter((u) => u.groupId !== id),
    }));
    if (activeGroupId === id) setActiveGroupId(null);
  };

  const addUser = async (user: Omit<AdminUser, "id"> & { isExisting?: boolean }) => {
    if (!canManage) return;
    const newUser: AdminUser = {
      id: Date.now().toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      telegram: user.telegram,
      phone: user.phone,
      groupId: user.groupId,
      login: user.login,
      password: user.password || "",
      role: "staff"
    };

    if (!user.isExisting) {
      const created = await registerStaffAccount({
        username: user.login,
        password: user.password,
        displayName: `${user.firstName} ${user.lastName}`,
      });
      if (!created.ok) {
        window.alert(created.message);
        return;
      }
    }
    setState((prev) => ({ ...prev, users: [...prev.users, newUser] }));
    setShowAddUser(false);
  };

  const removeUser = async (userId: string) => {
    if (!canManage) return;
    const user = state.users.find((u) => u.id === userId);
    if (user) {
      const removed = await removeStaffAccount(user.login);
      if (!removed.ok) {
        window.alert(removed.message);
        return;
      }
    }
    setState((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== userId),
    }));
  };

  const moveUser = (userId: string, newGroupId: string) => {
    if (!canManage) return;
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === userId ? { ...u, groupId: newGroupId } : u
      ),
    }));
    setShowMoveUser(null);
  };

  const activeGroup = state.groups.find((g) => g.id === activeGroupId);
  const groupUsers = activeGroupId
    ? state.users.filter((u) => u.groupId === activeGroupId)
    : [];

  // ─── Inside a group ───
  if (activeGroup) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={() => setActiveGroupId(null)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-bold gold-text truncate">
              {activeGroup.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {groupUsers.length} ta admin
            </p>
          </div>
          <Button
            size="sm"
            className="gold-gradient text-primary-foreground"
            onClick={() => setShowAddUser(true)}
            disabled={!canManage}
          >
            <UserPlus className="h-4 w-4 mr-1" /> Admin qo'shish
          </Button>
        </div>

        {groupUsers.length === 0 ? (
          <Card className="luxury-card">
            <CardContent className="p-10 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Bu guruhda hali admin yo'q
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groupUsers.map((user) => (
              <Card key={user.id} className="luxury-card group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-primary">@{user.telegram}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.phone}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {state.groups.length > 1 && canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => setShowMoveUser(user)}
                          title="Boshqa guruhga ko'chirish"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeUser(user.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add user dialog */}
        <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
          <DialogContent className="bg-card border-border max-w-md">
            <UserForm
              onSave={(u) =>
                addUser({ ...u, groupId: activeGroup.id, role: "staff" })
              }
              onCancel={() => setShowAddUser(false)}
              canManage={canManage}
              unassignedStaff={unassignedStaff}
            />
          </DialogContent>
        </Dialog>

        {/* Move user dialog */}
        <Dialog
          open={!!showMoveUser}
          onOpenChange={() => setShowMoveUser(null)}
        >
          <DialogContent className="bg-card border-border max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display gold-text">
                Guruhni tanlang
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground">
              {showMoveUser?.firstName} {showMoveUser?.lastName} ni boshqa
              guruhga ko'chirish
            </p>
            <div className="space-y-2 pt-2">
              {state.groups
                .filter((g) => g.id !== activeGroupId)
                .map((g) => (
                  <Button
                    key={g.id}
                    variant="outline"
                    className="w-full justify-start border-border text-foreground hover:border-primary"
                    onClick={() =>
                      showMoveUser && moveUser(showMoveUser.id, g.id)
                    }
                    disabled={!canManage}
                  >
                    <FolderOpen className="h-4 w-4 mr-2 text-primary" />
                    {g.name}
                  </Button>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── Groups overview ───
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Crown className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-display text-lg font-bold gold-text">
              Super Admin
            </h3>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Guruhlar boshqaruvi
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="gold-gradient text-primary-foreground"
          onClick={() => setShowCreateGroup(true)}
          disabled={!canManage}
        >
          <Plus className="h-4 w-4 mr-1" /> Guruh yaratish
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="luxury-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {state.groups.length}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Guruhlar
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="luxury-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {state.users.length}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Adminlar
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Group cards */}
      {state.groups.length === 0 ? (
        <Card className="luxury-card">
          <CardContent className="p-10 text-center">
            <FolderOpen className="h-14 w-14 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-1">
              Hozircha guruh mavjud emas
            </p>
            <p className="text-xs text-muted-foreground/60">
              "Guruh yaratish" tugmasini bosing
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {state.groups.map((group) => {
            const count = state.users.filter(
              (u) => u.groupId === group.id
            ).length;
            return (
              <Card
                key={group.id}
                className="luxury-card hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setActiveGroupId(group.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div
                      className="flex gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => setEditingGroup(group)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteGroup(group.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <h4 className="font-display text-sm font-semibold text-foreground mb-1 truncate">
                    {group.name}
                  </h4>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="text-primary border-primary/20 text-[10px]"
                    >
                      <Users className="h-3 w-3 mr-1" /> {count} admin
                    </Badge>
                    <span className="text-[10px] text-primary font-medium uppercase tracking-wider">
                      Kirish →
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create group dialog */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="bg-card border-border max-w-sm">
          <GroupNameForm
            title="Yangi guruh"
            onSave={createGroup}
            onCancel={() => setShowCreateGroup(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit group name dialog */}
      <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          {editingGroup && (
            <GroupNameForm
              title="Guruh nomini o'zgartirish"
              defaultValue={editingGroup.name}
              onSave={(name) => updateGroupName(editingGroup.id, name)}
              onCancel={() => setEditingGroup(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-forms ───

function GroupNameForm({
  title,
  defaultValue = "",
  onSave,
  onCancel,
}: {
  title: string;
  defaultValue?: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(defaultValue);
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display gold-text">{title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Guruh nomi"
          className="bg-secondary border-border"
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            className="gold-gradient text-primary-foreground flex-1"
            disabled={!name.trim()}
            onClick={() => onSave(name.trim())}
          >
            Saqlash
          </Button>
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={onCancel}
          >
            Bekor
          </Button>
        </div>
      </div>
    </>
  );
}

function UserForm({
  onSave,
  onCancel,
  canManage,
  unassignedStaff = [],
}: {
  onSave: (u: Omit<AdminUser, "id" | "groupId" | "role"> & { isExisting?: boolean }) => void;
  onCancel: () => void;
  canManage: boolean;
  unassignedStaff?: Array<{ username: string; displayName: string; telegram?: string; phone?: string; role: string }>;
}) {
  const [selectedStaffType, setSelectedStaffType] = useState<string>("new");
  const [selectedExistingUsername, setSelectedExistingUsername] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [phone, setPhone] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const handleSelectStaffType = (val: string) => {
    setSelectedStaffType(val);
    if (val === "new") {
      setSelectedExistingUsername("");
      setFirstName("");
      setLastName("");
      setTelegram("");
      setPhone("");
      setLogin("");
      setPassword("");
    } else {
      const staff = unassignedStaff.find(s => s.username === val);
      if (staff) {
        setSelectedExistingUsername(val);
        const parts = (staff.displayName || "").split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
        setTelegram(staff.telegram || "");
        setPhone(staff.phone || "");
        setLogin(staff.username || "");
        setPassword("********"); // dummy password
      }
    }
  };

  const isExisting = selectedStaffType !== "new";
  const canSave = isExisting 
    ? !!selectedExistingUsername 
    : (firstName.trim() && lastName.trim() && login.trim() && password.trim());

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display gold-text">
          Admin qo'shish
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-3 text-sm">
        {unassignedStaff.length > 0 && (
          <div>
            <label className="text-xs text-muted-foreground">Admin turi</label>
            <Select value={selectedStaffType} onValueChange={handleSelectStaffType}>
              <SelectTrigger className="bg-secondary border-border mt-1">
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="new">Yangi admin yaratish</SelectItem>
                {unassignedStaff.map((staff) => (
                  <SelectItem key={staff.username} value={staff.username}>
                    Mavjud: {staff.displayName} (@{staff.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground">Ism</label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Ism"
            className="bg-secondary border-border mt-1"
            disabled={isExisting}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Familiya</label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Familiya"
            className="bg-secondary border-border mt-1"
            disabled={isExisting}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">
            Telegram username
          </label>
          <Input
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="username"
            className="bg-secondary border-border mt-1"
            disabled={isExisting}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">
            Telefon raqam
          </label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
            className="bg-secondary border-border mt-1"
            disabled={isExisting}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Login</label>
          <Input
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="xodim.login"
            className="bg-secondary border-border mt-1"
            disabled={isExisting}
          />
        </div>
        {!isExisting && (
          <div>
            <label className="text-xs text-muted-foreground">Parol</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parol"
              className="bg-secondary border-border mt-1"
            />
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Button
            className="gold-gradient text-primary-foreground flex-1"
            disabled={!canSave || !canManage}
            onClick={() =>
              onSave({ firstName, lastName, telegram, phone, login, password, isExisting })
            }
          >
            Qo'shish
          </Button>
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={onCancel}
          >
            Bekor
          </Button>
        </div>
      </div>
    </>
  );
}
