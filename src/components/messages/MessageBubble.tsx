import { FileText, Video } from "lucide-react";
import { getAttachmentUrl } from "@/api/messages";
import { isJitsiCallLink } from "@/lib/jitsi";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "mov"]);
const AUDIO_EXTENSIONS = new Set(["webm", "mp3", "wav", "ogg", "m4a"]);

function fileExtension(filePath: string) {
  return filePath.split(".").pop()?.toLowerCase() ?? "";
}

function fileName(filePath: string) {
  return filePath.split("/").pop() ?? "Attachment";
}

export function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const isCallLink = isJitsiCallLink(message.content);

  return (
    <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
      {!isOwn && <span className="text-xs text-muted-foreground">{message.sender_name}</span>}
      <div
        className={cn(
          "max-w-sm rounded-lg px-3 py-2 text-sm",
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {isCallLink && message.content ? (
          <a
            href={message.content}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-medium underline underline-offset-2"
          >
            <Video className="size-4" />
            Join video call
          </a>
        ) : (
          message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {message.attachment_path && (
          <AttachmentPreview
            attachmentPath={message.attachment_path}
            mimeType={message.attachment_mime_type}
            url={getAttachmentUrl(message.id)}
            isOwn={isOwn}
          />
        )}
      </div>
      <span className="text-[11px] text-muted-foreground">{formatDateTime(message.sent_at)}</span>
    </div>
  );
}

function AttachmentPreview({
  attachmentPath,
  mimeType,
  url,
  isOwn,
}: {
  attachmentPath: string;
  mimeType: string | null;
  url: string;
  isOwn: boolean;
}) {
  const ext = fileExtension(attachmentPath);
  const isAudio = mimeType?.startsWith("audio/") || AUDIO_EXTENSIONS.has(ext);

  if (isAudio) {
    return <VoiceMessagePlayer url={url} isOwn={isOwn} />;
  }

  if (IMAGE_EXTENSIONS.has(ext)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img src={url} alt="Attachment" className="mt-2 max-h-56 rounded-md border object-cover" />
      </a>
    );
  }

  if (VIDEO_EXTENSIONS.has(ext)) {
    return (
      // Fixed width, not w-full/percentage: this bubble sits in a flex
      // column with align-items flex-end/flex-start (shrink-to-fit), so a
      // percentage-width child with no other content (e.g. no caption text)
      // has nothing to resolve against and collapses to 0 width.
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video controls src={url} className="mt-2 h-48 w-80 rounded-md border" />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "mt-2 flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs underline underline-offset-2",
        isOwn ? "border-primary-foreground/30" : "border-border",
      )}
    >
      <FileText className="size-4 shrink-0" />
      {fileName(attachmentPath)}
    </a>
  );
}
