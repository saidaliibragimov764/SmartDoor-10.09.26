import { FormEvent, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAdmin, AdminSession } from "./adminAuth";

interface AdminLoginFormProps {
  onSuccess: (session: AdminSession) => void;
}

export default function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Login va parol kiriting");
      return;
    }
    setLoading(true);
    setError("");
    const result = await loginAdmin(username.trim(), password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onSuccess(result.session);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-display text-xl font-bold gold-text">Xodim kirishi</h3>
        <p className="text-xs text-muted-foreground">
          Login va parol orqali admin panelga kiring
        </p>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Login</label>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-secondary border-border mt-1"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Parol</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-secondary border-border mt-1"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full gold-gradient text-primary-foreground"
      >
        {loading ? "Tekshirilmoqda..." : "Kirish"}
      </Button>
    </form>
  );
}
