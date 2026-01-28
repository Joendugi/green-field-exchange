import { useEffect, useState } from "react";
import { account, databases, client } from "@/lib/appwrite";
import { ID, Query, Permission, Role } from "appwrite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare, Search, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const Messages = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);


  useEffect(() => {
    // Auto-scroll to bottom when messages change
    const scrollArea = document.querySelector('.chat-scroll-area > div:first-child');
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);


  useEffect(() => {
    getCurrentUser();
    fetchConversations();
  }, []);


  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.$id);

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const unsubscribe = client.subscribe(
        [`databases.${dbId}.collections.messages.documents`, `databases.${dbId}.collections.conversations.documents`],
        (response) => {
          if (response.events.includes("databases.*.collections.messages.documents.*.create")) {
            const payload = response.payload as any;
            if (payload.conversation_id === selectedConversation.$id) {
              fetchMessages(selectedConversation.$id);
            }
          }
          if (response.events.includes("databases.*.collections.conversations.documents.*.update")) {
            fetchConversations();
          }
        }
      );


      return () => {
        unsubscribe();
      };
    }
  }, [selectedConversation]);

  const getCurrentUser = async () => {
    const user = await account.get().catch(() => null);
    if (user) setCurrentUserId(user.$id);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const { documents } = await databases.listDocuments(
        dbId,
        "profiles",
        [
          Query.notEqual("$id", currentUserId),
          Query.search("full_name", query)
        ]
      );
      setSearchResults(documents);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const startConversation = async (profile: any) => {
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      // Check if conversation already exists
      const existing = conversations.find(c =>
        (c.participant1_id === profile.$id && c.participant2_id === currentUserId) ||
        (c.participant1_id === currentUserId && c.participant2_id === profile.$id)
      );

      if (existing) {
        setSelectedConversation(existing);
        setSearchQuery("");
        setSearchResults([]);
        return;
      }

      const newConv = await databases.createDocument(
        dbId,
        "conversations",
        ID.unique(),
        {
          participant1_id: currentUserId,
          participant2_id: profile.$id,
          updated_at: new Date().toISOString(),
        },
        [
          Permission.read(Role.user(currentUserId)),
          Permission.read(Role.user(profile.$id)),
        ]
      );

      // Refresh conversations list
      await fetchConversations();

      const fullConv = {
        ...newConv,
        participant1: currentUserId === newConv.participant1_id ? null : profile, // We don't have our own profile here, but it's handled in fetchConversations
        participant2: currentUserId === newConv.participant2_id ? null : profile
      };

      // Re-fetch to get participants mapped correctly
      fetchConversations().then(() => {
        // Find the new conversation in the refreshed list
        setConversations(prev => {
          const updated = prev.find(c => c.$id === newConv.$id);
          if (updated) setSelectedConversation(updated);
          return prev;
        });
      });

      setSearchQuery("");
      setSearchResults([]);
    } catch (error: any) {
      toast.error("Failed to start conversation");
    }
  };


  const fetchConversations = async () => {
    const user = await account.get().catch(() => null);
    if (!user) return;

    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const { documents } = await databases.listDocuments(
      dbId,
      "conversations",
      [
        Query.or([
          Query.equal("participant1_id", user.$id),
          Query.equal("participant2_id", user.$id)
        ]),
        Query.orderDesc("$updatedAt")
      ]
    );

    let conversationsData = documents;

    // Manual join for participants and unread counts
    const participantIds = new Set<string>();
    conversationsData.forEach(c => {
      participantIds.add(c.participant1_id);
      participantIds.add(c.participant2_id);
    });

    if (participantIds.size > 0) {
      const profiles = await databases.listDocuments(
        dbId,
        "profiles",
        [Query.equal("$id", Array.from(participantIds))]
      );

      const profilesMap = profiles.documents.reduce((acc: any, p: any) => ({ ...acc, [p.$id]: p }), {});

      // Fetch unread counts for each conversation
      const unreadCountsPromises = conversationsData.map(async (c) => {
        try {
          return await databases.listDocuments(
            dbId,
            "messages",
            [
              Query.equal("conversation_id", c.$id),
              Query.equal("is_read", false),
              Query.notEqual("sender_id", user.$id),
              Query.limit(1)
            ]
          );
        } catch (e) {
          console.warn(`Unread count failed for conversation ${c.$id}:`, e);
          return { total: 0 };
        }
      });

      const unreadCountsResults = await Promise.all(unreadCountsPromises);

      conversationsData = conversationsData.map((c, index) => ({
        ...c,
        participant1: profilesMap[c.participant1_id],
        participant2: profilesMap[c.participant2_id],
        unreadCount: unreadCountsResults[index].total
      }));
    }

    setConversations(conversationsData);
  };

  const fetchMessages = async (conversationId: string) => {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const { documents } = await databases.listDocuments(
      dbId,
      "messages",
      [
        Query.equal("conversation_id", conversationId),
        Query.orderAsc("$createdAt")
      ]
    );

    setMessages(documents);

    // Mark unread messages as read
    try {
      const unreadMessages = documents.filter(m => !m.is_read && m.sender_id !== currentUserId);
      if (unreadMessages.length > 0) {
        unreadMessages.forEach(async (m) => {
          await databases.updateDocument(dbId, "messages", m.$id, { is_read: true }).catch(() => { });
        });
        // Update local state to reflect read status
        setMessages(prev => prev.map(m => (!m.is_read && m.sender_id !== currentUserId) ? { ...m, is_read: true } : m));
        // Refresh sidebar counts
        fetchConversations();
      }
    } catch (error) {
      console.warn("Could not mark messages as read (missing 'is_read' attribute?)", error);
    }
  };


  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    const content = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    // Optimistic Update
    const optimisticMessage = {
      $id: ID.unique(),
      conversation_id: selectedConversation.$id,
      sender_id: currentUserId,
      content: content,
      $createdAt: new Date().toISOString(),
      is_optimistic: true
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      await databases.createDocument(
        dbId,
        "messages",
        ID.unique(),
        {
          conversation_id: selectedConversation.$id,
          sender_id: currentUserId,
          content: content,
          is_read: false
        },
        [
          Permission.read(Role.user(selectedConversation.participant1_id)),
          Permission.read(Role.user(selectedConversation.participant2_id)),
          Permission.write(Role.user(currentUserId)),
        ]
      );

      // Update conversation summary
      await databases.updateDocument(
        dbId,
        "conversations",
        selectedConversation.$id,
        {
          updated_at: new Date().toISOString(),
          last_message: content,
          last_sender_id: currentUserId
        }
      ).catch(() => {
        // Fallback for missing fields (old schema)
        databases.updateDocument(dbId, "conversations", selectedConversation.$id, {
          updated_at: new Date().toISOString()
        });
      });

    } catch (error: any) {
      toast.error(error.message);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.$id !== optimisticMessage.$id));
    } finally {
      setIsSending(false);
    }
  };

  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const getOtherParticipant = (conversation: any) => {
    if (conversation.participant1_id === currentUserId) {
      return conversation.participant2;
    }
    return conversation.participant1;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      <Card className="md:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Conversations</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => { }}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {searchResults.length > 0 && (
            <div className="bg-secondary/50 border-b">
              <p className="px-4 py-2 text-xs font-semibold text-muted-foreground">Search Results</p>
              {searchResults.map((profile) => (
                <div
                  key={profile.$id}
                  className="p-4 flex items-center gap-3 cursor-pointer hover:bg-secondary"
                  onClick={() => startConversation(profile)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{profile.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{profile.full_name}</span>
                </div>
              ))}
            </div>
          )}
          <ScrollArea className="h-[450px]">

            {conversations.map((conversation) => {
              const other = getOtherParticipant(conversation);
              return (
                <div
                  key={conversation.$id}
                  className={`p-4 cursor-pointer hover:bg-secondary transition-colors border-b ${selectedConversation?.$id === conversation.$id ? "bg-secondary" : ""
                    }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {other?.full_name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{other?.full_name}</p>
                      {conversation.last_message && (
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {conversation.last_sender_id === currentUserId ? "You: " : ""}{conversation.last_message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap mb-1">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <div className="flex justify-end">
                        <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          {conversation.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>


                </div>
              );
            })}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        {selectedConversation ? (
          <>
            <CardHeader>
              <CardTitle>{getOtherParticipant(selectedConversation)?.full_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[400px] pr-4 chat-scroll-area">
                {messages.map((message) => (
                  <div
                    key={message.$id}
                    className={`mb-4 flex ${message.sender_id === currentUserId ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${message.sender_id === currentUserId
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                        }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center gap-1 mt-1 opacity-70">
                        <p className="text-[10px]">
                          {new Date(message.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {message.sender_id === currentUserId && (
                          <span className="text-[10px]">
                            {message.is_optimistic ? "..." : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>


              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                />
                <Button onClick={handleSendMessage} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4" />
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Messages;
