import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare, Search, Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";

const Messages = () => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isNewConvoOpen, setIsNewConvoOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Convex Queries
  const conversations = useQuery(api.messages.getConversations);
  const messages = useQuery(api.messages.getMessages, selectedConversationId ? { conversationId: selectedConversationId } : "skip");
  const searchResults = useQuery(api.users.searchUsers, { query: userSearchTerm });

  // Mutations
  const sendMessageMutation = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markAsRead);
  const startConversationMutation = useMutation(api.messages.startConversation);

  const selectedConversation = conversations?.find(c => c._id === selectedConversationId);

  useEffect(() => {
    if (selectedConversationId) {
      markAsRead({ conversationId: selectedConversationId });
    }
  }, [selectedConversationId, messages?.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || isSending) return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
      await sendMessageMutation({
        conversationId: selectedConversationId,
        content: content,
      }).catch((error) => {
        toast.error(error.message);
        setNewMessage(content);
      });
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleStartChat = async (otherUserId: Id<"users">) => {
    try {
      const convoId = await startConversationMutation({ otherUserId });
      setSelectedConversationId(convoId);
      setUserSearchTerm("");
      setIsNewConvoOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (conversations === undefined) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[700px]">
      <Card className="md:col-span-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Messages</CardTitle>
            <Dialog open={isNewConvoOpen} onOpenChange={setIsNewConvoOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>New Conversation</DialogTitle>
                  <DialogDescription>
                    Search for users to start a new chat.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      className="pl-8"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <ScrollArea className="h-[300px] border rounded-md p-2">
                    {userSearchTerm.length > 0 ? (
                      <div className="space-y-2">
                        {searchResults?.filter(u => u.userId !== currentUser?.userId).map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                            onClick={() => handleStartChat(user.userId)}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>
                                {user.full_name?.[0]?.toUpperCase() || user.username[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{user.full_name || user.username}</p>
                              <p className="text-xs text-muted-foreground">@{user.username}</p>
                            </div>
                            <Button size="sm" variant="ghost">Start Chat</Button>
                          </div>
                        ))}
                        {searchResults?.length === 0 && (
                          <p className="text-center text-sm text-muted-foreground py-8">No users found.</p>
                        )}
                        {searchResults === undefined && (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground py-8">Type to search for users.</p>
                    )}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="pl-8 bg-muted/50 border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border">
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-3 relative ${selectedConversationId === conversation._id ? "bg-muted/80" : ""
                    }`}
                  onClick={() => setSelectedConversationId(conversation._id)}
                >
                  <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                    <AvatarImage src={conversation.otherProfile?.avatar_url} />
                    <AvatarFallback className="bg-primary/5 text-primary">
                      {conversation.otherProfile?.full_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-semibold text-sm truncate">
                        {conversation.otherProfile?.full_name || "Unknown User"}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(conversation.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    {conversation.last_message && (
                      <p className="text-xs text-muted-foreground truncate pr-4">
                        {conversation.last_sender_id === currentUser?.userId ? "You: " : ""}{conversation.last_message}
                      </p>
                    )}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="absolute right-4 bottom-4 h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="p-8 text-center text-muted-foreground italic text-sm">
                  No conversations yet.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 flex flex-col overflow-hidden">
        {selectedConversationId ? (
          <>
            <CardHeader className="border-b shrink-0 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation?.otherProfile?.avatar_url} />
                  <AvatarFallback>
                    {selectedConversation?.otherProfile?.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{selectedConversation?.otherProfile?.full_name}</CardTitle>
                  <p className="text-xs text-emerald-500 font-medium">Online</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 pr-4">
                  {messages?.map((message, index) => {
                    const isMe = message.senderId === currentUser?.userId;
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm relative transition-all hover:shadow-md ${isMe
                            ? "bg-primary text-primary-foreground rounded-tr-none ml-12"
                            : "bg-muted text-foreground rounded-tl-none mr-12 border border-border/50"
                            }`}
                        >
                          <p className="leading-relaxed">{message.content}</p>
                          <div className={`text-[10px] mt-1.5 flex items-center gap-1.5 opacity-70 ${isMe ? "justify-end" : "justify-start"
                            }`}>
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isMe && (
                              <span className="flex items-center">
                                {message.is_read ? (
                                  <span className="text-blue-300 font-bold">✓✓</span>
                                ) : (
                                  <span>✓</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-muted/20">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Type your message..."
                    className="flex-1 bg-background border-none shadow-none focus-visible:ring-1"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isSending}
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5 gap-4">
            <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center">
              <MessageSquare className="h-10 w-10 opacity-20" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">Your Messages</h3>
              <p className="text-sm">Select a conversation from the sidebar to start chatting.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Messages;
