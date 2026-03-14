import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserAISettings } from "@shared/schema";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AISettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AISettingsDialog({ open, onOpenChange }: AISettingsDialogProps) {
  const { toast } = useToast();

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<UserAISettings>({
    queryKey: ['/api/ai-settings'],
    enabled: open,
  });

  // Local state for form values
  const [voiceEnabled, setVoiceEnabled] = useState(settings?.voice_enabled ?? true);
  const [preferredVoice, setPreferredVoice] = useState(settings?.preferred_voice ?? "alloy");
  const [voiceSpeed, setVoiceSpeed] = useState(parseFloat(settings?.voice_speed ?? "1.0"));
  const [autoPlayResponses, setAutoPlayResponses] = useState(settings?.auto_play_responses ?? true);
  const [cameraEnabled, setCameraEnabled] = useState(settings?.camera_enabled ?? true);
  const [fileUploadEnabled, setFileUploadEnabled] = useState(settings?.file_upload_enabled ?? true);
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(settings?.max_file_size_mb ?? 10);
  const [showTimestamps, setShowTimestamps] = useState(settings?.show_timestamps ?? true);
  const [sendTypingIndicators, setSendTypingIndicators] = useState(settings?.send_typing_indicators ?? true);
  const [messageSoundEnabled, setMessageSoundEnabled] = useState(settings?.message_sound_enabled ?? false);
  const [proactiveSuggestions, setProactiveSuggestions] = useState(settings?.proactive_suggestions ?? true);
  const [autoSaveConversations, setAutoSaveConversations] = useState(settings?.auto_save_conversations ?? true);
  const [contextWindowSize, setContextWindowSize] = useState(settings?.context_window_size ?? 10);
  const [notifyOnAIResponse, setNotifyOnAIResponse] = useState(settings?.notify_on_ai_response ?? false);
  const [saveVoiceRecordings, setSaveVoiceRecordings] = useState(settings?.save_voice_recordings ?? false);

  // Update settings when data loads
  useState(() => {
    if (settings) {
      setVoiceEnabled(settings.voice_enabled ?? true);
      setPreferredVoice(settings.preferred_voice ?? "alloy");
      setVoiceSpeed(parseFloat(settings.voice_speed ?? "1.0"));
      setAutoPlayResponses(settings.auto_play_responses ?? true);
      setCameraEnabled(settings.camera_enabled ?? true);
      setFileUploadEnabled(settings.file_upload_enabled ?? true);
      setMaxFileSizeMb(settings.max_file_size_mb ?? 10);
      setShowTimestamps(settings.show_timestamps ?? true);
      setSendTypingIndicators(settings.send_typing_indicators ?? true);
      setMessageSoundEnabled(settings.message_sound_enabled ?? false);
      setProactiveSuggestions(settings.proactive_suggestions ?? true);
      setAutoSaveConversations(settings.auto_save_conversations ?? true);
      setContextWindowSize(settings.context_window_size ?? 10);
      setNotifyOnAIResponse(settings.notify_on_ai_response ?? false);
      setSaveVoiceRecordings(settings.save_voice_recordings ?? false);
    }
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<UserAISettings>) => {
      return await apiRequest('/api/ai-settings', {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-settings'] });
      toast({
        title: "Settings saved",
        description: "Your AI preferences have been updated",
        duration: 2000,
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate({
      voice_enabled: voiceEnabled,
      preferred_voice: preferredVoice,
      voice_speed: voiceSpeed.toString(),
      auto_play_responses: autoPlayResponses,
      camera_enabled: cameraEnabled,
      file_upload_enabled: fileUploadEnabled,
      max_file_size_mb: maxFileSizeMb,
      show_timestamps: showTimestamps,
      send_typing_indicators: sendTypingIndicators,
      message_sound_enabled: messageSoundEnabled,
      proactive_suggestions: proactiveSuggestions,
      auto_save_conversations: autoSaveConversations,
      context_window_size: contextWindowSize,
      notify_on_ai_response: notifyOnAIResponse,
      save_voice_recordings: saveVoiceRecordings,
    });
  };

  const voices = [
    { value: "alloy", label: "Alloy (Neutral)" },
    { value: "echo", label: "Echo (Male)" },
    { value: "shimmer", label: "Shimmer (Female)" },
    { value: "ash", label: "Ash (Male)" },
    { value: "ballad", label: "Ballad (Male)" },
    { value: "coral", label: "Coral (Female)" },
    { value: "sage", label: "Sage (Wise)" },
    { value: "verse", label: "Verse (Expressive)" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-ai-settings">
        <DialogHeader>
          <DialogTitle>AI Assistant Settings</DialogTitle>
          <DialogDescription>
            Customize your Sparky AI experience with voice, camera, and chat preferences.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="voice" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
            </TabsList>

            <TabsContent value="voice" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="voice-enabled">Voice Input/Output</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable voice conversations with Sparky
                  </p>
                </div>
                <Switch
                  id="voice-enabled"
                  checked={voiceEnabled}
                  onCheckedChange={setVoiceEnabled}
                  data-testid="switch-voice-enabled"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred-voice">Voice Personality</Label>
                <Select value={preferredVoice} onValueChange={setPreferredVoice}>
                  <SelectTrigger id="preferred-voice" data-testid="select-voice">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.value} value={voice.value}>
                        {voice.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice-speed">
                  Voice Speed: {voiceSpeed.toFixed(1)}x
                </Label>
                <Slider
                  id="voice-speed"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[voiceSpeed]}
                  onValueChange={(value) => setVoiceSpeed(value[0])}
                  data-testid="slider-voice-speed"
                />
                <p className="text-sm text-muted-foreground">
                  Adjust how fast Sparky speaks (0.5x - 2.0x)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-play">Auto-play Responses</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically play voice responses
                  </p>
                </div>
                <Switch
                  id="auto-play"
                  checked={autoPlayResponses}
                  onCheckedChange={setAutoPlayResponses}
                />
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="camera-enabled">Camera Access</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow Sparky to use your camera
                  </p>
                </div>
                <Switch
                  id="camera-enabled"
                  checked={cameraEnabled}
                  onCheckedChange={setCameraEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="file-upload">File Uploads</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow file attachments in chat
                  </p>
                </div>
                <Switch
                  id="file-upload"
                  checked={fileUploadEnabled}
                  onCheckedChange={setFileUploadEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-file-size">
                  Max File Size: {maxFileSizeMb} MB
                </Label>
                <Slider
                  id="max-file-size"
                  min={1}
                  max={50}
                  step={1}
                  value={[maxFileSizeMb]}
                  onValueChange={(value) => setMaxFileSizeMb(value[0])}
                />
              </div>
            </TabsContent>

            <TabsContent value="chat" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-timestamps">Show Timestamps</Label>
                  <p className="text-sm text-muted-foreground">
                    Display message timestamps
                  </p>
                </div>
                <Switch
                  id="show-timestamps"
                  checked={showTimestamps}
                  onCheckedChange={setShowTimestamps}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="typing-indicators">Typing Indicators</Label>
                  <p className="text-sm text-muted-foreground">
                    Show when Sparky is thinking
                  </p>
                </div>
                <Switch
                  id="typing-indicators"
                  checked={sendTypingIndicators}
                  onCheckedChange={setSendTypingIndicators}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="message-sound">Message Sounds</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sound for new messages
                  </p>
                </div>
                <Switch
                  id="message-sound"
                  checked={messageSoundEnabled}
                  onCheckedChange={setMessageSoundEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="proactive">Proactive Suggestions</Label>
                  <p className="text-sm text-muted-foreground">
                    Sparky offers helpful suggestions
                  </p>
                </div>
                <Switch
                  id="proactive"
                  checked={proactiveSuggestions}
                  onCheckedChange={setProactiveSuggestions}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save">Auto-save Conversations</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save chat history
                  </p>
                </div>
                <Switch
                  id="auto-save"
                  checked={autoSaveConversations}
                  onCheckedChange={setAutoSaveConversations}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="context-window">
                  Context Window: {contextWindowSize} messages
                </Label>
                <Slider
                  id="context-window"
                  min={5}
                  max={50}
                  step={5}
                  value={[contextWindowSize]}
                  onValueChange={(value) => setContextWindowSize(value[0])}
                />
                <p className="text-sm text-muted-foreground">
                  Number of recent messages Sparky remembers
                </p>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-response">Response Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when Sparky responds
                  </p>
                </div>
                <Switch
                  id="notify-response"
                  checked={notifyOnAIResponse}
                  onCheckedChange={setNotifyOnAIResponse}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="save-recordings">Save Voice Recordings</Label>
                  <p className="text-sm text-muted-foreground">
                    Store your voice messages permanently
                  </p>
                </div>
                <Switch
                  id="save-recordings"
                  checked={saveVoiceRecordings}
                  onCheckedChange={setSaveVoiceRecordings}
                />
              </div>

              <div className="rounded-lg border border-muted p-4 space-y-2">
                <h4 className="font-medium text-sm">Privacy Notice</h4>
                <p className="text-sm text-muted-foreground">
                  Your conversations with Sparky are stored securely and used only to provide better assistance. 
                  Voice recordings are automatically deleted after 24 hours unless you enable permanent storage.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveSettingsMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending || isLoading}
            data-testid="button-save-settings"
          >
            {saveSettingsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
