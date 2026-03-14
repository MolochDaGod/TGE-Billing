import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AIChatSession } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Trash2,
  Plus,
  Loader2,
  Mic,
  FileText,
  Video,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AIChatHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSessionId?: string;
  onSessionSelect: (sessionId: string | null) => void;
  onNewChat: () => void;
}

export function AIChatHistory({
  open,
  onOpenChange,
  currentSessionId,
  onSessionSelect,
  onNewChat,
}: AIChatHistoryProps) {
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  // Fetch chat sessions
  const { data: sessions = [], isLoading } = useQuery<AIChatSession[]>({
    queryKey: ['/api/ai-chat/sessions'],
    enabled: open,
  });

  // Delete session mutation (soft delete by updating metadata)
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiRequest(`/api/ai-chat/sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ metadata: { deleted: true } }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-chat/sessions'] });
      setDeleteSessionId(null);
    },
  });

  const handleNewChat = () => {
    onNewChat();
    onOpenChange(false);
  };

  const handleSessionClick = (sessionId: string) => {
    onSessionSelect(sessionId);
    onOpenChange(false);
  };

  const getSessionIcon = (mode: string) => {
    switch (mode) {
      case 'voice':
        return <Mic className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getSessionSummary = (session: AIChatSession) => {
    if (session.summary) {
      return session.summary;
    }
    return session.title;
  };

  // Filter out deleted sessions
  const activeSession = sessions.filter(
    (s) => !(s.metadata as any)?.deleted
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-80" data-testid="sheet-chat-history">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat History
            </SheetTitle>
            <SheetDescription>
              View and continue previous conversations
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <Button
              onClick={handleNewChat}
              className="w-full"
              data-testid="button-new-chat"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Conversation
            </Button>

            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : activeSession.length === 0 ? (
              <div className="text-center p-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No saved conversations yet
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="space-y-2 pr-4">
                  {activeSession.map((session) => (
                    <div
                      key={session.id}
                      className={`group relative rounded-lg border p-3 hover-elevate cursor-pointer transition-colors ${
                        currentSessionId === session.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-card'
                      }`}
                      onClick={() => handleSessionClick(session.id)}
                      data-testid={`session-item-${session.id}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-1 text-muted-foreground">
                          {getSessionIcon(session.conversation_mode || 'text')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium line-clamp-1">
                            {session.title}
                          </h4>
                          {session.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {session.summary}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(session.updated_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteSessionId(session.id);
                        }}
                        data-testid={`button-delete-${session.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleteSessionId !== null}
        onOpenChange={() => setDeleteSessionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat history. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteSessionId) {
                  deleteSessionMutation.mutate(deleteSessionId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
