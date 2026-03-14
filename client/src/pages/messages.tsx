import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { puterChat } from "@/lib/puter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Send, Bot, Hash, Users, Lock, Sparkles, MessageSquare } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface TeamMessage {
  id: string;
  channel: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  is_ai_message: boolean;
  ai_trigger: string | null;
  created_at: string;
}

const ADMIN_ROLES = ["pirate_king", "admin", "partner", "staff_captain"];
const CREW_ROLES = [...ADMIN_ROLES, "staff", "sparky_ai", "sparky"];

const CHANNELS = [
  { id: "general", name: "General", icon: Hash, description: "Open to all", roles: null as string[] | null },
  { id: "crew", name: "Crew", icon: Users, description: "Staff & above", roles: CREW_ROLES },
  { id: "admin", name: "Admin Only", icon: Lock, description: "Leadership only", roles: ADMIN_ROLES },
];

const ROLE_COLORS: Record<string, string> = {
  pirate_king: "text-yellow-400",
  admin: "text-red-400",
  partner: "text-purple-400",
  staff_captain: "text-blue-400",
  staff: "text-emerald-400",
  sparky_ai: "text-cyan-400",
  sparky: "text-cyan-300",
  client: "text-slate-400",
  vendor: "text-orange-400",
};

const ROLE_LABELS: Record<string, string> = {
  pirate_king: "👑 King",
  admin: "🛡️ Admin",
  partner: "🤝 Partner",
  staff_captain: "⚡ Captain",
  staff: "🔧 Staff",
  sparky_ai: "🤖 Sparky AI",
  sparky: "✨ Sparky",
  client: "👤 Client",
  vendor: "📦 Vendor",
};

function formatMsgTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return `Yesterday ${format(d, "h:mm a")}`;
  return format(d, "MMM d, h:mm a");
}

function getInitials(name: string) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeChannel, setActiveChannel] = useState("general");
  const [newMessage, setNewMessage] = useState("");
  const [aiLoadingFor, setAiLoadingFor] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const userRole = (user as any)?.role ?? "client";
  const userName = (user as any)?.name || (user as any)?.username || "You";

  const canAccessChannel = (ch: (typeof CHANNELS)[0]) => {
    if (!ch.roles) return true;
    return ch.roles.includes(userRole);
  };

  const { data: messages = [], isLoading } = useQuery<TeamMessage[]>({
    queryKey: ["/api/team/messages", activeChannel],
    queryFn: async () => {
      const res = await fetch(`/api/team/messages?channel=${activeChannel}&limit=100`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 3000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/team/messages", {
        channel: activeChannel,
        content,
        sender_name: userName,
        sender_role: userRole,
      });
      return res.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/team/messages", activeChannel] });
    },
    onError: () =>
      toast({ title: "Error", description: "Could not send message", variant: "destructive" }),
  });

  const handleSend = () => {
    const text = newMessage.trim();
    if (!text) return;
    sendMutation.mutate(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const askSparky = async (msg: TeamMessage) => {
    setAiLoadingFor(msg.id);
    try {
      const reply = await puterChat([
        {
          role: "system",
          content:
            "You are Sparky, the TGE Pros AI assistant. You help with electrical job scheduling, invoicing, and team coordination. Be friendly, concise, and helpful.",
        },
        { role: "user", content: msg.content },
      ]);

      await apiRequest("POST", "/api/team/messages", {
        channel: activeChannel,
        content: reply,
        sender_name: "Sparky AI",
        sender_role: "sparky_ai",
        is_ai_message: true,
        ai_trigger: msg.id,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team/messages", activeChannel] });
    } catch {
      toast({
        title: "Sparky Error",
        description: "AI response failed. Try again.",
        variant: "destructive",
      });
    } finally {
      setAiLoadingFor(null);
    }
  };

  const activeChInfo = CHANNELS.find((c) => c.id === activeChannel)!;

  return (
    <div
      className="flex overflow-hidden rounded-xl border border-border/50"
      style={{ height: "calc(100vh - 5.5rem)" }}
    >
      {/* Sidebar */}
      <div className="w-52 flex-shrink-0 bg-card border-r border-border/50 flex flex-col">
        <div className="px-4 py-3 border-b border-border/50">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Channels
          </span>
        </div>

        <div className="flex-1 p-2 space-y-0.5">
          {CHANNELS.map((ch) => {
            const Icon = ch.icon;
            const accessible = canAccessChannel(ch);
            const isActive = activeChannel === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => accessible && setActiveChannel(ch.id)}
                disabled={!accessible}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left",
                  isActive
                    ? "bg-primary/15 text-primary font-semibold"
                    : "hover:bg-muted/60 text-muted-foreground hover:text-foreground",
                  !accessible && "opacity-35 cursor-not-allowed"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 truncate">{ch.name}</span>
                {!accessible && <Lock className="h-3 w-3 opacity-60" />}
              </button>
            );
          })}
        </div>

        <div className="p-3 border-t border-border/50 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
              {getInitials(userName)}
            </div>
            <span className="text-xs font-medium truncate">{userName}</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 ml-auto flex-shrink-0" />
          </div>
          <Badge variant="outline" className="text-[9px] capitalize px-1.5">
            {ROLE_LABELS[userRole] ?? userRole}
          </Badge>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/30">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-border/50 flex items-center gap-3 bg-card/40">
          <activeChInfo.icon className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm">{activeChInfo.name}</span>
            <span className="text-xs text-muted-foreground ml-2">{activeChInfo.description}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-cyan-400">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Sparky AI online</span>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-3">
          {isLoading ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <MessageSquare className="h-10 w-10 opacity-25" />
              <p className="text-sm">No messages yet. Say hello! 👋</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === (user as any)?.id;
                const isAI = msg.is_ai_message;
                const showHeader = i === 0 || messages[i - 1].sender_id !== msg.sender_id;
                return (
                  <div key={msg.id} className={cn("flex gap-2.5 group", isMe && "flex-row-reverse")}>
                    {showHeader ? (
                      <div className={cn(
                        "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5",
                        isAI
                          ? "bg-cyan-900/50 text-cyan-300 border border-cyan-700/50"
                          : isMe
                          ? "bg-primary/30 text-primary"
                          : "bg-muted text-foreground"
                      )}>
                        {isAI ? "⚡" : getInitials(msg.sender_name)}
                      </div>
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )}
                    <div className={cn("flex flex-col max-w-[68%]", isMe && "items-end")}>
                      {showHeader && (
                        <div className={cn("flex items-baseline gap-1.5 mb-1", isMe && "flex-row-reverse")}>
                          <span className="text-xs font-semibold leading-none">{msg.sender_name}</span>
                          <span className={cn("text-[9px] leading-none", ROLE_COLORS[msg.sender_role] ?? "text-muted-foreground")}>
                            {ROLE_LABELS[msg.sender_role] ?? msg.sender_role}
                          </span>
                          <span className="text-[9px] text-muted-foreground leading-none">
                            {formatMsgTime(msg.created_at)}
                          </span>
                        </div>
                      )}
                      <div className={cn(
                        "px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : isAI
                          ? "bg-cyan-950/60 text-cyan-50 border border-cyan-800/40 rounded-tl-sm"
                          : "bg-muted rounded-tl-sm"
                      )}>
                        {msg.content}
                      </div>
                      {!isAI && !isMe && (
                        <button
                          onClick={() => askSparky(msg)}
                          disabled={aiLoadingFor !== null}
                          className="mt-0.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-200 transition-all disabled:cursor-not-allowed"
                        >
                          <Sparkles className="h-3 w-3" />
                          {aiLoadingFor === msg.id ? "Sparky thinking…" : "Ask Sparky ⚡"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Composer */}
        <div className="px-4 pb-4 pt-2 border-t border-border/40">
          <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2 border border-border/50 focus-within:border-primary/50 transition-colors">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${activeChInfo.name.toLowerCase()}…`}
              className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 px-0 h-7 text-sm"
            />
            <Button
              size="icon"
              className="h-7 w-7 rounded-lg flex-shrink-0"
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMutation.isPending}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
            Enter to send · Hover any message to Ask Sparky ⚡
          </p>
        </div>
      </div>
    </div>
  );
}
