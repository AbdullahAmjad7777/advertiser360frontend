import { useEffect, useRef } from "react";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { conversationDisplayName } from "./ConversationList";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import type { Conversation, Message } from "@/types";

export function ChatPanel({
  conversation,
  messages,
  currentUserId,
  loading,
  onSend,
  onStartCall,
}: {
  conversation: Conversation;
  messages: Message[];
  currentUserId: number;
  loading: boolean;
  onSend: (
    content: string,
    attachment: File | null,
    onProgress?: (percent: number) => void,
  ) => Promise<void>;
  onStartCall: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">
          {conversationDisplayName(conversation, currentUserId)}
        </h2>
        <Button variant="outline" size="sm" onClick={onStartCall}>
          <Video className="size-4" />
          Start call
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === currentUserId}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <MessageInput onSend={onSend} />
    </div>
  );
}
