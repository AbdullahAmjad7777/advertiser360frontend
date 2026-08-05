import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import type { Conversation } from "@/types";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function conversationDisplayName(conversation: Conversation, currentUserId: number) {
  if (conversation.is_group) return conversation.name ?? "Group chat";
  const other = conversation.participants.find((p) => p.employee_id !== currentUserId);
  return other?.full_name ?? "Unknown";
}

function lastMessagePreview(conversation: Conversation) {
  if (conversation.last_message_content) return conversation.last_message_content;
  if (conversation.last_message_attachment_path) return "📎 Attachment";
  return "No messages yet";
}

export function ConversationList({
  conversations,
  selectedId,
  currentUserId,
  onSelect,
}: {
  conversations: Conversation[];
  selectedId: number | null;
  currentUserId: number;
  onSelect: (conversation: Conversation) => void;
}) {
  if (conversations.length === 0) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        No conversations yet. Start one to say hello.
      </p>
    );
  }

  return (
    <ul className="flex flex-col overflow-y-auto">
      {conversations.map((conversation) => {
        const name = conversationDisplayName(conversation, currentUserId);
        return (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelect(conversation)}
              className={cn(
                "flex w-full items-start gap-3 border-b px-3 py-3 text-left transition-colors hover:bg-muted",
                selectedId === conversation.id && "bg-muted",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {initials(name)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{name}</span>
                  {conversation.last_message_sent_at && (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatDateTime(conversation.last_message_sent_at)}
                    </span>
                  )}
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted-foreground">
                    {lastMessagePreview(conversation)}
                  </span>
                  {conversation.unread_count > 0 && (
                    <Badge className="h-4 min-w-4 shrink-0 justify-center rounded-full px-1 text-[10px]">
                      {conversation.unread_count}
                    </Badge>
                  )}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
