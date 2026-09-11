import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { getApiBaseUrl, getAuthHeaders } from "./adminAuth";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  text: string;
  at: string;
  from: { username: string; displayName: string; role: "super_admin" | "staff" };
};

export default function AdminChatPanel({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadMessages = () => {
    setLoading(true);
    fetch(`${getApiBaseUrl()}/api/chat/messages`, { headers: { ...getAuthHeaders() } })
      .then((r) => r.json())
      .then((data) => setMessages(Array.isArray(data?.messages) ? data.messages : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMessages();
    const id = window.setInterval(loadMessages, 2500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const canSend = useMemo(() => text.trim().length > 0 && !sending, [text, sending]);

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    setSending(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ text: value }),
      });
      if (!res.ok) return;
      setText("");
      loadMessages();
    } finally {
      setSending(false);
    }
  };

  return (
    <aside
      className={cn(
        "w-[300px] shrink-0 border border-border bg-card/20 backdrop-blur-sm rounded-xl overflow-hidden",
        className
      )}
    >
      <div className={cn("flex flex-col w-full", compact ? "h-[72vh]" : "h-[calc(100vh-5rem)]")}>
        <div className="h-14 border-b border-border flex items-center px-4">
          <p className="font-display text-sm font-semibold gold-text">Umumiy chat</p>
        </div>

        <ScrollArea className="flex-1 px-3 py-3">
          {loading && messages.length === 0 && (
            <p className="text-xs text-muted-foreground px-1">Yuklanmoqda...</p>
          )}
          <div className="space-y-2">
            {messages.map((m) => (
              <Card key={m.id} className="glass-card">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-medium text-foreground truncate">
                      {m.from.displayName}
                      <span className="text-muted-foreground"> @{m.from.username}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <p className={cn("text-xs text-foreground/90 whitespace-pre-wrap break-words")}>
                    {m.text}
                  </p>
                </CardContent>
              </Card>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-border p-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Xabar yozing..."
            className="min-h-[70px] bg-secondary border-border"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-muted-foreground">Ctrl+Enter yuborish</p>
            <Button
              size="sm"
              className="gold-gradient text-primary-foreground"
              disabled={!canSend}
              onClick={() => void send()}
            >
              <Send className="h-4 w-4 mr-1" />
              Yuborish
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

