import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Bell, KeyRound, ShieldCheck } from "lucide-react";
import {
  AdminSession,
  changeAdminPassword,
  fetchRecoveryChannel,
  requestPasswordChangeOtp,
  saveRecoveryChannel,
} from "./adminAuth";

interface AdminSettingsProps {
  session: AdminSession;
  canManageAdmins: boolean;
}

export default function AdminSettings({ session, canManageAdmins }: AdminSettingsProps) {
  const [profileName, setProfileName] = useState(session.displayName);
  const [profilePhone, setProfilePhone] = useState("+998 90 000 00 00");

  const [channelType, setChannelType] = useState<"telegram" | "gmail">("telegram");
  const [channelAddress, setChannelAddress] = useState("");
  const [recovery, setRecovery] = useState<{
    type: "telegram" | "gmail";
    address: string;
    locked: boolean;
  } | null>(null);

  const [oldCode, setOldCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!canManageAdmins) return;
    fetchRecoveryChannel().then((result) => {
      if (result.ok) setRecovery(result.channel);
    });
  }, [canManageAdmins]);

  const saveRecovery = async () => {
    if (recovery?.locked) return;
    if (!channelAddress.trim()) {
      setMessage("Telegram yoki Gmail manzilini kiriting");
      return;
    }
    const next = {
      type: channelType,
      address: channelAddress.trim(),
      locked: true,
    } as const;
    const result = await saveRecoveryChannel(next);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setRecovery(result.channel);
    setMessage("Manzil saqlandi. Endi kod shu manzilga yuboriladi.");
  };

  const sendOtp = async () => {
    setMessage("");
    if (!oldCode.trim()) {
      setMessage("Avvalgi admin kodini kiriting");
      return;
    }
    if (!newCode.trim() || newCode.length < 8) {
      setMessage("Yangi kod kamida 8 belgidan iborat bo'lsin");
      return;
    }
    if (newCode !== confirmCode) {
      setMessage("Yangi kodlar bir xil emas");
      return;
    }

    const otp = await requestPasswordChangeOtp();
    if (!otp.ok) {
      setMessage(otp.message);
      return;
    }
    setOtpRequested(true);
    setMessage(`Kod ${otp.channel.type === "telegram" ? "Telegram" : "Gmail"} manziliga yuborildi: ${otp.channel.address}`);
  };

  const applyNewCode = async () => {
    setMessage("");
    if (!otpRequested) {
      setMessage("Avval tasdiqlash kodini yuboring");
      return;
    }
    const changed = await changeAdminPassword({
      oldPassword: oldCode,
      newPassword: newCode,
      otpCode,
    });
    if (!changed.ok) {
      setMessage(changed.message);
      return;
    }
    setMessage("Admin kodi muvaffaqiyatli almashtirildi");
    setOldCode("");
    setNewCode("");
    setConfirmCode("");
    setOtpCode("");
    setOtpRequested(false);
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Admin profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Ism</label>
            <Input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="bg-secondary border-border mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Telefon</label>
            <Input
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              className="bg-secondary border-border mt-1"
            />
          </div>
          <Button size="sm" className="gold-gradient text-primary-foreground w-full">
            Saqlash
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Tasdiqlash manzili
            {recovery?.locked && (
              <Badge variant="outline" className="text-primary border-primary/30 text-[10px] ml-auto">
                Bir martalik saqlangan
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Kanal turi</label>
            <select
              className="w-full bg-secondary border border-border mt-1 rounded-md px-3 py-2 text-sm"
              value={channelType}
              onChange={(e) => setChannelType(e.target.value as "telegram" | "gmail")}
              disabled={!!recovery?.locked || !canManageAdmins}
            >
              <option value="telegram">Telegram</option>
              <option value="gmail">Gmail</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Manzil</label>
            <Input
              placeholder={channelType === "telegram" ? "@username yoki chat id" : "example@gmail.com"}
              className="bg-secondary border-border mt-1"
              value={channelAddress}
              onChange={(e) => setChannelAddress(e.target.value)}
              disabled={!!recovery?.locked || !canManageAdmins}
            />
          </div>
          {recovery?.locked && (
            <p className="text-xs text-muted-foreground">
              Saqlangan: {recovery.type} - {recovery.address}
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            className="w-full border-primary/30 text-primary"
            onClick={saveRecovery}
            disabled={!!recovery?.locked || !canManageAdmins}
          >
            Bir martalik saqlash
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" /> Admin kodni almashtirish
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Avvalgi kod</label>
            <Input
              type="password"
              value={oldCode}
              onChange={(e) => setOldCode(e.target.value)}
              className="bg-secondary border-border mt-1"
              disabled={!canManageAdmins}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Yangi kod</label>
            <Input
              type="password"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="bg-secondary border-border mt-1"
              disabled={!canManageAdmins}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Yangi kodni tasdiqlang</label>
            <Input
              type="password"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              className="bg-secondary border-border mt-1"
              disabled={!canManageAdmins}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full border-primary/30 text-primary"
            onClick={sendOtp}
            disabled={!canManageAdmins}
          >
            Tasdiqlash kodini yuborish
          </Button>
          <div>
            <label className="text-xs text-muted-foreground">1 martalik kod</label>
            <Input
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="bg-secondary border-border mt-1"
              disabled={!canManageAdmins}
            />
          </div>
          <Button
            size="sm"
            className="gold-gradient text-primary-foreground w-full"
            onClick={applyNewCode}
            disabled={!canManageAdmins}
          >
            Kodni almashtirish
          </Button>
          {!!message && <p className="text-xs text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Bildirishnomalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Yangi buyurtma, to'lov va holat o'zgarishi haqida bildirishnomalar sozlamalari.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
