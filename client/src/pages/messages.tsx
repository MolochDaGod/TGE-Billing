import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Users, MessageSquare } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  username: string;
  email: string | null;
  role: string;
  phone_number: string | null;
  full_name: string | null;
}

interface Message {
  id: string;
  to: string;
  recipient: string;
  message: string;
  timestamp: string;
}

export default function Messages() {
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [message, setMessage] = useState("");
  const [sentMessages, setSentMessages] = useState<Message[]>([]);

  const { data: employees, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const employeesWithPhone = employees?.filter(
    (emp) => (emp.role === "employee" || emp.role === "admin") && emp.phone_number
  ) || [];

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { to: string; message: string }) => {
      const res = await apiRequest("POST", "/api/notifications/sms", data);
      return await res.json();
    },
    onSuccess: (data, variables) => {
      const employee = employeesWithPhone.find(emp => emp.phone_number === variables.to);
      const newMessage: Message = {
        id: data.sid || Date.now().toString(),
        to: variables.to,
        recipient: employee?.full_name || employee?.username || "Unknown",
        message: variables.message,
        timestamp: new Date().toISOString(),
      };
      setSentMessages(prev => [newMessage, ...prev]);
      setMessage("");
      toast({
        title: "Message Sent",
        description: `Text message sent to ${newMessage.recipient}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!selectedEmployee || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select an employee and enter a message",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      to: selectedEmployee,
      message: message.trim(),
    });
  };

  const selectedEmployeeData = employeesWithPhone.find(
    emp => emp.phone_number === selectedEmployee
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Send SMS messages to your team</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Message
            </CardTitle>
            <CardDescription>
              Select an employee and compose your message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Employee</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder="Choose an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employeesWithPhone.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No employees with phone numbers
                    </SelectItem>
                  ) : (
                    employeesWithPhone.map((emp) => (
                      <SelectItem key={emp.id} value={emp.phone_number!}>
                        {emp.full_name || emp.username} ({emp.phone_number})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedEmployeeData && (
              <div className="p-3 bg-muted rounded-md space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedEmployeeData.full_name || selectedEmployeeData.username}
                  </span>
                  <Badge variant="outline">{selectedEmployeeData.role}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedEmployeeData.phone_number}
                </p>
                {selectedEmployeeData.email && (
                  <p className="text-xs text-muted-foreground">
                    {selectedEmployeeData.email}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={320}
                data-testid="textarea-message"
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/320 characters
              </p>
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending || !selectedEmployee || !message.trim()}
              className="w-full"
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Sent Messages
            </CardTitle>
            <CardDescription>
              Recent messages sent from this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sentMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No messages sent yet</p>
                <p className="text-xs mt-1">Messages you send will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {sentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 border rounded-lg space-y-2"
                    data-testid={`message-${msg.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{msg.recipient}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{msg.to}</p>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Message Templates</CardTitle>
          <CardDescription>Click to use a template</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Please call the office when you have a moment.",
              "We have a new job assignment for you. Check your schedule.",
              "Great work today! Thanks for your dedication.",
              "Reminder: Please submit your timesheet by end of day.",
              "Meeting at the office tomorrow at 9 AM.",
              "Client needs assistance at their location. Can you help?",
            ].map((template, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="text-left h-auto py-2 px-3 justify-start whitespace-normal"
                onClick={() => setMessage(template)}
                data-testid={`template-${idx}`}
              >
                <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-xs">{template}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
