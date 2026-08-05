export function generateJitsiCallLink(conversationId: number): string {
  const randomToken = Math.random().toString(36).slice(2, 10);
  return `https://meet.jit.si/Advertiser360-${conversationId}-${randomToken}`;
}

export function isJitsiCallLink(content: string | null): boolean {
  return Boolean(content?.startsWith("https://meet.jit.si/"));
}
