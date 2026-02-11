import { useState } from "react";
import { ExecutionMethod } from "appwrite";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2 } from "lucide-react";
import { functions } from "@/lib/appwrite";
import { toast } from "sonner";

const AIAssistant = () => {
  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AgriLink AI assistant. I can help you with agricultural advice, market insights, pricing guidance, and farming best practices. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const execution = await functions.createExecution(
        "ai-chat", // Assuming function ID is "ai-chat"
        JSON.stringify({ messages: [...messages, userMessage] }),
        false, // async = false (wait for response)
        "/", // path
        ExecutionMethod.POST, // method
        { "Content-Type": "application/json" } // headers
      );

      if (execution.status !== "completed") {
        throw new Error("Function execution failed");
      }

      const data = JSON.parse(execution.responseBody);

      const assistantMessage = {
        role: "assistant",
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast.error("Failed to get AI response");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>
              Get agricultural advice, market insights, and farming guidance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[500px] pr-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary"
                  }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-secondary rounded-lg p-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2">
          <Textarea
            placeholder="Ask me anything about agriculture..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            rows={3}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAssistant;
