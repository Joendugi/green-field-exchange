import { useState, useEffect, useRef } from "react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { getChatHistory, chatWithAI } from "@/integrations/supabase/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X, MessageSquare, Loader2, Minus, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const AIFloatingBubble = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: historyData } = useSupabaseQuery<any>(
    ["aiChatHistory"],
    () => getChatHistory(),
    { enabled: isAuthenticated }
  );
  const history: any[] = historyData || [];

  useEffect(() => {
    if (history && history.length > 0) {
      const formattedHistory = [...history]
        .sort((a, b) => a.created_at - b.created_at)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      setMessages(formattedHistory);
    } else {
        setMessages([
            {
              role: "assistant",
              content: "Hi! I'm your Wakulima AI. How can I help you with your farm or orders today?",
            },
          ]);
    }
  }, [history]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatWithAI(updatedMessages.map(m => ({ role: m.role, content: m.content })));
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (error: any) {
      toast.error("Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && !isMinimized && (
        <Card className="w-[350px] sm:w-[400px] h-[500px] mb-4 shadow-2xl border-primary/20 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="bg-primary text-primary-foreground py-3 px-4 flex flex-row items-center justify-between rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-sm">Wakulima AI Assistant</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-white/10" onClick={() => setIsMinimized(true)}>
                <Minus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-white/10" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 p-4">
              {messages.map((m, i) => (
                <div key={i} className={`mb-4 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"}`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-muted rounded-2xl rounded-tl-none p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </ScrollArea>
            <div className="p-3 border-t bg-muted/30">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask a question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  className="resize-none text-sm min-h-[44px]"
                />
                <Button size="icon" className="h-[44px] w-[44px] shrink-0" onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isOpen && isMinimized && (
        <Card className="mb-4 shadow-xl border-primary/20 animate-in slide-in-from-bottom-2">
            <Button 
                variant="outline" 
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border-0"
                onClick={() => setIsMinimized(false)}
            >
                <Bot className="h-4 w-4" />
                <span>AI Assistant (Active)</span>
                <Maximize2 className="h-3 w-3 ml-2" />
            </Button>
        </Card>
      )}

      {!isOpen && (
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:scale-110 transition-transform duration-300"
          onClick={() => setIsOpen(true)}
        >
          <Bot className="h-7 w-7" />
        </Button>
      )}
    </div>
  );
};

export default AIFloatingBubble;
