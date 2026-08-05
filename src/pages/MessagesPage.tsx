import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import * as conversationsApi from "@/api/conversations";
import * as messagesApi from "@/api/messages";
import { ChatPanel } from "@/components/messages/ChatPanel";
import { ConversationList } from "@/components/messages/ConversationList";
import { NewConversationDialog } from "@/components/messages/NewConversationDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/api-client";
import { generateJitsiCallLink } from "@/lib/jitsi";
import { getSocket } from "@/lib/socket";
import type { Conversation, Message } from "@/types";

function upsertConversationPreview(
  conversations: Conversation[],
  conversationId: number,
  updates: Partial<Conversation>,
) {
  const idx = conversations.findIndex((c) => c.id === conversationId);
  if (idx === -1) return conversations;
  const updated = { ...conversations[idx], ...updates };
  const rest = conversations.filter((_, i) => i !== idx);
  return [updated, ...rest];
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newConversationOpen, setNewConversationOpen] = useState(false);

  const selectedRef = useRef<Conversation | null>(null);
  const markedReadRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const loadConversations = useCallback(async () => {
    const result = await conversationsApi.fetchConversations({ limit: 50 });
    setConversations(result.items);
    setConversationsLoading(false);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (conversationId: number) => {
    setMessagesLoading(true);
    try {
      const result = await conversationsApi.fetchMessages(conversationId, { limit: 50 });
      setMessages([...result.items].reverse());
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  function handleSelect(conversation: Conversation) {
    setSelected(conversation);
    loadMessages(conversation.id);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversation.id ? { ...c, unread_count: 0 } : c)),
    );
  }

  function handleConversationCreated(conversation: Conversation) {
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === conversation.id);
      if (exists) return prev.map((c) => (c.id === conversation.id ? conversation : c));
      return [conversation, ...prev];
    });
    handleSelect(conversation);
  }

  // Mark incoming messages as read while the conversation is open.
  useEffect(() => {
    if (!selected || !user) return;
    for (const message of messages) {
      if (message.sender_id !== user.id && !markedReadRef.current.has(message.id)) {
        markedReadRef.current.add(message.id);
        messagesApi.markMessageRead(message.id).catch(() => {});
      }
    }
  }, [messages, selected, user]);

  // Real-time updates.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleNewMessage(message: Message) {
      const isActive = selectedRef.current?.id === message.conversation_id;

      setConversations((prev) => {
        const target = prev.find((c) => c.id === message.conversation_id);
        if (!target) {
          loadConversations();
          return prev;
        }
        return upsertConversationPreview(prev, message.conversation_id, {
          last_message_id: message.id,
          last_message_content: message.content,
          last_message_attachment_path: message.attachment_path,
          last_message_sent_at: message.sent_at,
          last_message_sender_id: message.sender_id,
          unread_count: isActive ? 0 : target.unread_count + 1,
        });
      });

      if (isActive) {
        setMessages((prev) => [...prev, message]);
      }
    }

    socket.on("message:new", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [loadConversations]);

  async function handleSend(
    content: string,
    attachment: File | null,
    onProgress?: (percent: number) => void,
  ) {
    if (!selected) return;
    try {
      const message = await conversationsApi.sendMessage(
        selected.id,
        {
          content: content || undefined,
          attachment: attachment ?? undefined,
        },
        onProgress,
      );
      setMessages((prev) => [...prev, message]);
      setConversations((prev) =>
        upsertConversationPreview(prev, selected.id, {
          last_message_id: message.id,
          last_message_content: message.content,
          last_message_attachment_path: message.attachment_path,
          last_message_sent_at: message.sent_at,
          last_message_sender_id: message.sender_id,
        }),
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to send message"));
    }
  }

  async function handleStartCall() {
    if (!selected) return;
    const link = generateJitsiCallLink(selected.id);
    await handleSend(link, null);
    window.open(link, "_blank", "noopener,noreferrer");
  }

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[500px] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">Chat with anyone on your team.</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden rounded-md border">
        <div className="flex w-72 shrink-0 flex-col border-r">
          <div className="flex items-center justify-between border-b px-3 py-2.5">
            <span className="text-sm font-medium">Conversations</span>
            <Button size="icon-sm" variant="outline" onClick={() => setNewConversationOpen(true)}>
              <Plus className="size-4" />
            </Button>
          </div>
          {conversationsLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading...</p>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedId={selected?.id ?? null}
              currentUserId={user.id}
              onSelect={handleSelect}
            />
          )}
        </div>

        <div className="flex-1">
          {selected ? (
            <ChatPanel
              conversation={selected}
              messages={messages}
              currentUserId={user.id}
              loading={messagesLoading}
              onSend={handleSend}
              onStartCall={handleStartCall}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Select a conversation or start a new one.
            </div>
          )}
        </div>
      </div>

      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        onCreated={handleConversationCreated}
      />
    </div>
  );
}
