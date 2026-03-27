import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Send, X, Loader2, Minimize2, Maximize2, Mic, AlertCircle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { puterChat, isPuterReady } from "@/lib/puter";
import { useToast } from "@/hooks/use-toast";
import { useImprovedVoiceActivation } from "@/hooks/useImprovedVoiceActivation";
import { MicrophoneStatus, MicrophoneIndicator } from "@/components/MicrophoneStatus";
import { AIThinkingLoader } from "@/components/video-loader";

interface Message {
  role: "user" | "assistant";
  content: string;
  status?: "sending" | "sent" | "error";
  id?: string;
  timestamp?: number;
}

interface AIAssistantProps {
  context?: string;
  pageName?: string;
  externalIsOpen?: boolean;
  externalSetIsOpen?: (isOpen: boolean) => void;
}

export function AIAssistant({ context, pageName = "Dashboard", externalIsOpen, externalSetIsOpen }: AIAssistantProps) {
  const { user } = useAuth();
  
  // Safety check: Don't render if user context isn't ready
  // This prevents React hook errors during initialization
  if (!user) {
    return null;
  }

  return <AIAssistantInternal context={context} pageName={pageName} externalIsOpen={externalIsOpen} externalSetIsOpen={externalSetIsOpen} />;
}

function AIAssistantInternal({ context, pageName = "Dashboard", externalIsOpen, externalSetIsOpen }: AIAssistantProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load chat history from localStorage
    try {
      const saved = localStorage.getItem('tge-chat-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [hasShownVoicePrompt, setHasShownVoicePrompt] = useState(false);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [pushToTalkTranscript, setPushToTalkTranscript] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "error">("connected");
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pushToTalkRecognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isListening,
    isActivated,
    transcript: voiceTranscript,
    error: voiceError,
    permissionStatus,
    isSupported,
    isEligibleRole,
    toggleListening,
  } = useImprovedVoiceActivation({
    onActivated: () => {
      setIsOpen(true);
      setIsMinimized(false);
      toast({
        title: "🎤 Assistant Activated",
        description: "How can I help you?",
        duration: 3000,
      });
    },
    onTranscript: (transcript) => {
      // Auto-populate input with voice transcript when activated
      if (transcript && transcript.trim()) {
        setInput(transcript);
      }
    },
    enabled: voiceEnabled,
  });

  // Show voice activation prompt on first load for eligible users
  useEffect(() => {
    if (isSupported && isEligibleRole && !hasShownVoicePrompt && !isListening) {
      setHasShownVoicePrompt(true);
      
      // Show prominent toast prompting voice activation
      setTimeout(() => {
        toast({
          title: "🎤 Enable Voice Control",
          description: "Click the microphone button to activate voice commands anytime.",
          duration: 8000,
        });
      }, 2000);
    }
  }, [isSupported, isEligibleRole, hasShownVoicePrompt, isListening, toast]);

  // Save chat history to localStorage
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem('tge-chat-history', JSON.stringify(messages));
      } else {
        localStorage.removeItem('tge-chat-history');
      }
    } catch (error) {
      console.error('[TGE Assistant] Failed to save chat history:', error);
    }
  }, [messages]);

  // Check for voice input from hold-to-talk button
  useEffect(() => {
    if (isOpen && !isLoading) {
      const voiceInput = localStorage.getItem('tge-voice-input');
      if (voiceInput && voiceInput.trim()) {
        setInput(voiceInput);
        localStorage.removeItem('tge-voice-input');
        
        // Auto-send the voice input after a brief delay
        setTimeout(() => {
          // Trigger send by simulating the sendMessage call
          sendMessage();
        }, 800);
      }
    }
  }, [isOpen]);

  // Auto-scroll to follow chat messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isTyping]);

  // Initialize push-to-talk speech recognition
  useEffect(() => {
    if (!isSupported || !isEligibleRole) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setPushToTalkTranscript(transcript);
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("Push-to-talk error:", event.error);
      }
    };

    pushToTalkRecognitionRef.current = recognition;

    return () => {
      if (pushToTalkRecognitionRef.current) {
        try {
          pushToTalkRecognitionRef.current.stop();
        } catch (e) {
          // Silently handle cleanup
        }
      }
    };
  }, [isSupported, isEligibleRole]);
  const getSystemPrompt = (): string => {
    const roleContext: Record<string, string> = {
      pirate_king: `You are the TGE Operations Assistant, a business intelligence tool for the business owner. Provide direct, data-driven analysis across all operations: revenue, staff, clients, vendors, invoices, estimates, and strategy. Focus on actionable recommendations tied to business outcomes. You have full visibility into the platform — invoices, jobs, users, vendors, analytics, AI agents, settings, and compliance.`,

      partner: `You are the TGE Operations Assistant for a Partner-level manager. Help manage their division's staff, clients, invoices, and jobs. Focus on execution, team performance, and profitability. Provide practical, leadership-focused guidance on CRM, analytics, user management, and reporting.`,

      admin: `You are the TGE Operations Assistant, a professional business operations tool for system administrators. Help manage the full platform: invoices, estimates, clients, vendors, jobs, staff, compliance, and analytics.

Platform capabilities you can assist with:
- Invoice & Estimate Management: Create, edit, send, and track invoices and estimates
- Client CRM: Contact management, activity tracking, segmentation, follow-ups
- Job Scheduling: Assignments, progress tracking, appointments
- Payments: Stripe integration, tracking, reminders via SMS/email
- Team Management: Role assignments, department coordination, onboarding workflows
- Vendor Management: Contractor profiles, services, portfolios
- Communications: Team messaging, email notifications, SMS via Twilio
- Compliance: Permits, inspections, work orders, checklists
- Analytics: Revenue tracking, pipeline metrics, client lifetime value
Be direct, concise, and action-oriented. Reference specific platform features when giving guidance. End with clear next steps.`,

      staff_captain: `You are the TGE Operations Assistant for a Team Lead. Help manage their team: job scheduling, task assignments, quality tracking, and compliance checklists. Provide practical guidance on client management, invoicing, and work order coordination. Be clear, organized, and focused on operational efficiency.`,

      staff: `You are the TGE Operations Assistant for a staff member. Help with day-to-day tasks: viewing assigned jobs, creating invoices, managing client interactions, tracking job progress, and accessing compliance documentation. Provide clear, practical guidance on using the platform effectively.`,

      employee: `You are the TGE Operations Assistant for a team member. Help with invoices, client management, job tracking, and compliance. Provide practical, actionable guidance on platform features and workflows. Be concise and professional.`,

      vendor: `You are the TGE Operations Assistant for a contractor/vendor. Help manage their clients, invoices, active jobs, and vendor profile. Assist with updating services, pricing, portfolio, and tracking bookings. Be practical and business-focused.`,

      client: `You are the TGE Assistant, a professional customer service tool. Help clients with:
- Viewing and paying invoices
- Checking job status and scheduling appointments
- Understanding service details and pricing
- Accessing service history and payment records
- Requesting new estimates or services
- Referral program information

Be clear, helpful, and professional. Avoid jargon. Guide users through the platform with step-by-step instructions when needed.`,
    };

    return roleContext[user?.role ?? ""] ?? roleContext.client;
  };

  const sendMessage = async (retryCount = 0) => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setInput("");
    
    // Add user message with status tracking
    const userMsg: Message = { 
      role: "user" as const, 
      content: userMessage,
      status: "sending",
      id: messageId,
      timestamp: Date.now()
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Mark message as sent
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, status: "sent" as const } : m
      ));

      // Build conversation messages for Puter AI
      const chatMessages = [
        { role: "system", content: getSystemPrompt() },
        { role: "system", content: `📍 Current Context: ${pageName}. ${context || ""}` },
        ...updatedMessages.map(m => ({ role: m.role, content: m.content })),
      ];

      let responseText: string;

      // Use Puter AI (free, no API key) if available, fallback to backend
      if (isPuterReady()) {
        responseText = await puterChat(chatMessages, { model: "gpt-4o" });
      } else {
        // Fallback to backend API if Puter SDK not loaded
        const response = await apiRequest("POST", "/api/ai/assistant", {
          messages: chatMessages,
          sessionId: user?.id || "anonymous",
          pageName,
          context,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        responseText = data.message;
      }

      setConnectionStatus("connected");
      
      if (responseText) {
        // Stop typing indicator
        setIsTyping(false);
        
        // Add assistant response
        const assistantMessage: Message = { 
          role: "assistant" as const, 
          content: responseText,
          status: "sent",
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Show response in toast for voice context
        if (isActivated) {
          toast({
            title: "TGE Assistant",
            description: responseText.substring(0, 100),
            duration: 3000,
          });
        }
      }
    } catch (error: any) {
      console.error("[TGE Assistant] Error:", error);
      setIsTyping(false);
      setConnectionStatus("error");
      
      // Mark message as error
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, status: "error" as const } : m
      ));

      // Retry logic with exponential backoff
      const maxRetries = 3;
      if (retryCount < maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        toast({
          title: "Retrying...",
          description: `Attempt ${retryCount + 1}/${maxRetries}`,
          duration: 2000,
        });
        
        setTimeout(() => {
          setInput(userMessage);
          setMessages(prev => prev.filter(m => m.id !== messageId));
          sendMessage(retryCount + 1);
        }, retryDelay);
      } else {
        toast({
          title: "Connection Issue",
          description: "The assistant couldn't respond. Please check your internet and try again.",
          variant: "destructive",
          action: {
            label: "Retry",
            onClick: () => {
              setInput(userMessage);
              setMessages(prev => prev.filter(m => m.id !== messageId));
              sendMessage(0);
            }
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startPushToTalk = () => {
    if (!pushToTalkRecognitionRef.current || isPushToTalkActive) return;
    
    setPushToTalkTranscript("");
    setIsPushToTalkActive(true);
    
    try {
      pushToTalkRecognitionRef.current.start();
      toast({
        title: "🎤 Recording...",
        description: "Hold button and speak, release when done",
        duration: 2000,
      });
    } catch (e) {
      console.warn("Failed to start push-to-talk:", e);
    }
  };

  const stopPushToTalk = () => {
    if (!pushToTalkRecognitionRef.current || !isPushToTalkActive) return;
    
    try {
      pushToTalkRecognitionRef.current.stop();
      setIsPushToTalkActive(false);
      
      if (pushToTalkTranscript.trim()) {
        toast({
          title: "✅ Voice input captured",
          description: "Click send or press Enter to submit",
          duration: 2000,
        });
      }
    } catch (e) {
      console.warn("Failed to stop push-to-talk:", e);
    }
  };

  if (!isOpen) {
    return null;
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50" data-testid="container-ai-assistant-minimized">
        <Card className="w-80 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              TGE Assistant
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsMinimized(false)}
                data-testid="button-maximize-assistant"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-assistant"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] flex flex-col" data-testid="container-ai-assistant">
      <Card className="flex flex-col h-full shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            TGE Assistant
            <span className="text-xs font-normal text-muted-foreground">
              ({user?.role})
            </span>
            {connectionStatus === "error" && (
              <span className="text-xs bg-destructive/20 px-2 py-1 rounded-full flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Offline
              </span>
            )}
            {isActivated && (
              <span className="text-xs bg-primary/20 px-2 py-1 rounded-full animate-pulse">
                Listening...
              </span>
            )}
          </CardTitle>
          <div className="flex gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setMessages([]);
                  localStorage.removeItem('tge-chat-history');
                  toast({
                    title: "Chat cleared",
                    description: "Conversation history has been cleared",
                    duration: 2000,
                  });
                }}
                title="Clear chat history"
                data-testid="button-clear-chat"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {isSupported && isEligibleRole && (
              <MicrophoneStatus
                isListening={isListening}
                isActivated={isActivated}
                error={voiceError}
                permissionStatus={permissionStatus}
                onToggle={() => {
                  setVoiceEnabled(!voiceEnabled);
                  toggleListening();
                  if (!isListening) {
                    toast({
                      title: "Voice Listening Started",
                      description: "Say 'assistant' to activate voice commands",
                      duration: 3000,
                    });
                  }
                }}
                className="h-8 w-8"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMinimized(true)}
              data-testid="button-minimize-assistant"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
              data-testid="button-close-assistant-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-4 overflow-hidden flex flex-col">
          {voiceError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {voiceError}
              </AlertDescription>
            </Alert>
          )}
          <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef} data-testid="scroll-messages">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4" data-testid="container-welcome">
                <Sparkles className="h-12 w-12 text-primary mb-3 animate-pulse" />
                <p className="text-sm font-medium mb-2">TGE Operations Assistant</p>
                <p className="text-xs text-muted-foreground">
                  Your AI-powered business operations tool.
                  <br />Ask about invoices, estimates, clients, jobs, or anything else.
                </p>
                {isSupported && isEligibleRole && (
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20 space-y-2">
                    <p className="text-xs font-medium text-primary flex items-center justify-center gap-1">
                      <Mic className="h-4 w-4 animate-pulse" />
                      Voice Control Available
                    </p>
                    <p className="text-xs text-center">
                      1. Click the <strong>microphone button</strong> above
                      <br />
                      2. Speak your question
                      <br />
                      3. Press send to submit
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
                    data-testid={`message-${message.role}-${index}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === "user" && message.status && (
                      <div className="mb-1" title={message.status === "sending" ? "Sending..." : message.status === "error" ? "Failed to send" : "Delivered"}>
                        {message.status === "sending" && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                        {message.status === "sent" && (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        )}
                        {message.status === "error" && (
                          <XCircle className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start" data-testid="container-typing-indicator">
                    <div className="bg-muted rounded-lg overflow-hidden">
                      <AIThinkingLoader message="Processing..." />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
              data-testid="input-ai-message"
            />
            <div className="flex flex-col gap-2">
              {isSupported && isEligibleRole && (
                <Button
                  onMouseDown={startPushToTalk}
                  onMouseUp={stopPushToTalk}
                  onMouseLeave={stopPushToTalk}
                  onTouchStart={startPushToTalk}
                  onTouchEnd={stopPushToTalk}
                  variant={isPushToTalkActive ? "default" : "outline"}
                  size="icon"
                  className={`h-[60px] w-[60px] ${isPushToTalkActive ? 'animate-pulse bg-red-500 hover:bg-red-600' : ''}`}
                  disabled={isLoading}
                  title="Hold to speak"
                  data-testid="button-push-to-talk"
                >
                  {isPushToTalkActive ? (
                    <Mic className="h-5 w-5 animate-pulse" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
              )}
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-[60px] w-[60px]"
                data-testid="button-send-message"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
