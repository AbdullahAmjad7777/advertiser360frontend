import { useRef, useState, type ClipboardEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { Mic, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { VoiceRecorderBar } from "./VoiceRecorderBar";

const MAX_ATTACHMENT_SIZE_BYTES = 100 * 1024 * 1024; // keep in sync with the backend limit
const ACCEPTED_TYPES =
  "image/png,image/jpeg,image/gif,image/webp," +
  "video/mp4,video/quicktime," +
  "audio/webm,audio/mpeg,audio/mp4,audio/wav,audio/ogg," +
  "application/pdf,.docx,.xlsx,.zip";

export function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (
    content: string,
    attachment: File | null,
    onProgress?: (percent: number) => void,
  ) => Promise<void>;
  disabled?: boolean;
}) {
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorder = useVoiceRecorder();

  function pickAttachment(file: File) {
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      toast.error("File is too large. Maximum attachment size is 100MB.");
      return;
    }
    setAttachment(file);
  }

  async function sendPayload(text: string, file: File | null) {
    setSending(true);
    setUploadProgress(file ? 0 : null);
    try {
      await onSend(text, file, file ? (percent) => setUploadProgress(percent) : undefined);
      setContent("");
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setSending(false);
      setUploadProgress(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() && !attachment) return;
    await sendPayload(content.trim(), attachment);
  }

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          pickAttachment(file);
          toast.success("Image attached from clipboard");
        }
        return;
      }
    }
  }

  async function handleMicClick() {
    if (recorder.isRecording) return;
    try {
      await recorder.start();
    } catch {
      toast.error("Microphone permission is required to record a voice message.");
    }
  }

  async function handleStopRecording() {
    const file = await recorder.stop();
    if (file) {
      await sendPayload("", file);
    }
  }

  if (recorder.isRecording) {
    return (
      <div className="border-t p-3">
        <VoiceRecorderBar
          seconds={recorder.seconds}
          levels={recorder.levels}
          onStop={handleStopRecording}
          onCancel={recorder.cancel}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t p-3">
      {attachment && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{attachment.name}</span>
          {uploadProgress !== null && (
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setAttachment(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            aria-label="Remove attachment"
            disabled={sending}
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_TYPES}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) pickAttachment(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || sending}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach a file"
        >
          <Paperclip className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || sending}
          onClick={handleMicClick}
          aria-label="Record a voice message"
        >
          <Mic className="size-4" />
        </Button>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Type a message... (paste an image with Ctrl+V)"
          className="min-h-9 flex-1 resize-none py-1.5"
          rows={1}
          disabled={disabled || sending}
        />
        <Button type="submit" size="icon" disabled={disabled || sending}>
          <Send className="size-4" />
        </Button>
      </div>
    </form>
  );
}
