import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppContext";
import { User, Phone, MapPin } from "lucide-react";

export default function WelcomeDialog() {
  const { profileSetupDone, updateProfile } = useAppState();
  const [open, setOpen] = useState(!profileSetupDone);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");

  const canSubmit = fullName.trim() && phone.trim() && address.trim();

  const handleSave = () => {
    updateProfile({ fullName, phone, address, district });
    setOpen(false);
  };

  if (profileSetupDone) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-card border-border max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg gold-text text-center">
            Xush kelibsiz!
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground text-sm">
            Buyurtma berish uchun ma'lumotlaringizni kiriting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
            <Input
              placeholder="To'liq ismingiz"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
            <Input
              placeholder="+998 90 000 00 00"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
            <Input
              placeholder="Manzilingiz"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <Input
            placeholder="Tuman / Shahar"
            value={district}
            onChange={e => setDistrict(e.target.value)}
            className="bg-card border-border"
          />

          <Button
            onClick={handleSave}
            disabled={!canSubmit}
            className="w-full gold-gradient text-primary-foreground font-semibold tracking-wide"
          >
            Davom etish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
