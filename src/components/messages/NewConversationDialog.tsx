import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createConversation } from "@/api/conversations";
import * as employeesApi from "@/api/employees";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getErrorMessage } from "@/lib/api-client";
import type { Conversation, DirectoryEntry } from "@/types";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function NewConversationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (conversation: Conversation) => void;
}) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [startingId, setStartingId] = useState<number | null>(null);
  const debouncedSearch = useDebouncedValue(search, 250);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setEntries([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    employeesApi
      .fetchDirectory(debouncedSearch || undefined)
      .then((data) => setEntries(data.filter((entry) => entry.id !== user?.id)));
  }, [open, debouncedSearch, user?.id]);

  async function handleStart(entry: DirectoryEntry) {
    setStartingId(entry.id);
    try {
      const conversation = await createConversation({ participantIds: [entry.id] });
      onOpenChange(false);
      onCreated(conversation);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to start conversation"));
    } finally {
      setStartingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
          <DialogDescription>Search for a colleague to start messaging.</DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <ul className="flex max-h-72 flex-col overflow-y-auto">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => handleStart(entry)}
                disabled={startingId !== null}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {initials(entry.full_name)}
                </span>
                <span className="flex flex-col">
                  <span className="font-medium">{entry.full_name}</span>
                  <span className="text-xs capitalize text-muted-foreground">
                    {entry.role_name}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {entries.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">No matches.</p>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
