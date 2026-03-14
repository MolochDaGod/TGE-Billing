import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Bot, MessageSquare, TrendingUp, Calendar, Shield, Zap, Settings, Send, Loader2 } from "lucide-react";
import type { AIAgent } from "@shared/schema";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIAgentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  const { data: agents = [], isLoading } = useQuery<AIAgent[]>({
    queryKey: ['/api/ai-agents'],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ agentId, messages }: { agentId: string; messages: Message[] }) => {
      const response = await apiRequest("POST", "/api/agent-conversations", {
        agent_id: agentId,
        user_id: user?.id,
        session_id: sessionId,
        messages: JSON.stringify(messages),
      });
      const conversation = await response.json();

      const chatResponse = await apiRequest("POST", `/api/agent-conversations/${conversation.id}/messages`, {
        messages,
        agentId,
      });
      return chatResponse.json();
    },
    onSuccess: (data) => {
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      setCurrentMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!currentMessage.trim() || !selectedAgent) return;

    const userMessage: Message = { role: "user", content: currentMessage };
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);

    sendMessageMutation.mutate({
      agentId: selectedAgent.id,
      messages: newMessages,
    });
  };

  const startChat = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setChatMessages([]);
    setCurrentMessage("");
    setIsChatting(true);
  };

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case "booking":
        return <Calendar className="h-6 w-6" />;
      case "sales":
        return <TrendingUp className="h-6 w-6" />;
      case "support":
        return <MessageSquare className="h-6 w-6" />;
      case "compliance":
        return <Shield className="h-6 w-6" />;
      default:
        return <Bot className="h-6 w-6" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground">
            Specialized AI assistants for booking, sales, support, and compliance
          </p>
        </div>
        {user?.role === 'admin' && (
          <Dialog>
            <DialogTrigger asChild>
              <Button data-testid="button-create-agent">
                <Zap className="mr-2 h-4 w-4" />
                Create Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New AI Agent</DialogTitle>
                <DialogDescription>
                  Configure a new AI agent with specialized capabilities
                </DialogDescription>
              </DialogHeader>
              <CreateAgentForm />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="hover-elevate" data-testid={`card-agent-${agent.id}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {getAgentIcon(agent.agent_type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {agent.agent_type}
                    </Badge>
                  </div>
                </div>
                {agent.is_active && (
                  <Badge variant="default" className="bg-green-500">
                    Active
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-3">
                {agent.description}
              </CardDescription>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Conversations:</span>
                  <span className="font-medium">{agent.total_conversations || 0}</span>
                </div>
                {agent.avg_response_time && (
                  <div className="flex justify-between">
                    <span>Avg Response:</span>
                    <span className="font-medium">{parseFloat(agent.avg_response_time).toFixed(1)}s</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button 
                className="flex-1" 
                onClick={() => startChat(agent)}
                data-testid={`button-chat-${agent.id}`}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat
              </Button>
              {user?.role === 'admin' && (
                <Button variant="outline" size="icon" data-testid={`button-settings-${agent.id}`}>
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No AI Agents Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first AI agent to get started with automated customer interactions
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isChatting} onOpenChange={setIsChatting}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAgent && getAgentIcon(selectedAgent.agent_type)}
              {selectedAgent?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedAgent?.description}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                    data-testid={`message-${msg.role}-${idx}`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="Type your message..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              disabled={sendMessageMutation.isPending}
              data-testid="input-chat-message"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!currentMessage.trim() || sendMessageMutation.isPending}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateAgentForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    agent_type: "booking",
    name: "",
    description: "",
    system_prompt: "",
    capabilities: [] as string[],
  });

  const createAgentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/ai-agents", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-agents'] });
      toast({
        title: "Success",
        description: "AI agent created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create AI agent",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAgentMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="agent_type">Agent Type</Label>
        <select
          id="agent_type"
          className="w-full mt-1 p-2 border rounded-md"
          value={formData.agent_type}
          onChange={(e) => setFormData({ ...formData, agent_type: e.target.value })}
          data-testid="select-agent-type"
        >
          <option value="booking">Booking Agent</option>
          <option value="sales">Sales Agent</option>
          <option value="support">Support Agent</option>
          <option value="compliance">Compliance Agent</option>
        </select>
      </div>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          data-testid="input-agent-name"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          data-testid="textarea-agent-description"
        />
      </div>
      <div>
        <Label htmlFor="system_prompt">System Prompt</Label>
        <Textarea
          id="system_prompt"
          value={formData.system_prompt}
          onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
          rows={5}
          required
          data-testid="textarea-system-prompt"
        />
      </div>
      <Button type="submit" className="w-full" disabled={createAgentMutation.isPending} data-testid="button-submit-agent">
        {createAgentMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Agent"
        )}
      </Button>
    </form>
  );
}
