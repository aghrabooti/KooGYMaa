// Shared, framework-free helpers for the trainer ↔ student messaging hub.
// The hub deliberately reuses the existing `Feedback` rows instead of adding a
// new model: one Feedback row = one message, and `trainerClientId` binds every
// message to the coaching relationship (the conversation). This keeps older
// progress feedback and its replies visible inside the same chat.

export type MessageRole = "trainer" | "user";

export type RelationshipView = {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerEmail?: string | null;
  gymName?: string | null;
  status: string;
  href?: string | null;
};

export type RawMessage = {
  id: string;
  trainerClientId: string | null;
  authorId: string;
  recipientId: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
  type: string;
  author: { name: string };
};

export type MessageView = {
  id: string;
  body: string;
  at: string;
  authorId: string;
  authorName: string;
  mine: boolean;
  type: string;
  unread: boolean;
};

export type ConversationView = {
  id: string;
  name: string;
  subtitle: string;
  status: string;
  initials: string;
  unread: number;
  messages: MessageView[];
  lastAt: string | null;
  href: string | null;
};

const MAX_MESSAGES = 200;

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

/** Group every message of a relationship into a single, easy-to-read chat. */
export function buildConversations(
  relationships: RelationshipView[],
  messages: RawMessage[],
  viewerId: string,
): ConversationView[] {
  const byRelationship = new Map<string, RawMessage[]>();
  for (const message of messages) {
    if (!message.trainerClientId) continue;
    const bucket = byRelationship.get(message.trainerClientId) ?? [];
    bucket.push(message);
    byRelationship.set(message.trainerClientId, bucket);
  }

  return relationships
    .map((relationship) => {
      const rows = (byRelationship.get(relationship.id) ?? [])
        .slice()
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .slice(-MAX_MESSAGES);

      const view: MessageView[] = rows.map((row) => ({
        id: row.id,
        body: row.content,
        at: row.createdAt.toISOString(),
        authorId: row.authorId,
        authorName: row.author.name,
        mine: row.authorId === viewerId,
        type: row.type,
        unread: row.recipientId === viewerId && !row.readAt,
      }));

      const last = rows.at(-1);
      return {
        id: relationship.id,
        name: relationship.partnerName,
        subtitle: relationship.gymName || relationship.partnerEmail || "",
        status: relationship.status,
        initials: initialsOf(relationship.partnerName),
        unread: view.filter((item) => item.unread).length,
        messages: view,
        lastAt: last ? last.createdAt.toISOString() : null,
        href: relationship.href ?? null,
      } satisfies ConversationView;
    })
    .sort((a, b) => {
      const byTime = (b.lastAt ? Date.parse(b.lastAt) : 0) - (a.lastAt ? Date.parse(a.lastAt) : 0);
      return byTime || a.name.localeCompare(b.name, "fa");
    });
}
