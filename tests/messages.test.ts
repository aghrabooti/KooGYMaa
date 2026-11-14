import { describe, expect, it } from "vitest";
import { buildConversations, initialsOf, type RawMessage, type RelationshipView } from "../lib/messages";

const relationships: RelationshipView[] = [
  { id: "rel-1", partnerId: "member-1", partnerName: "نیما احمدی", status: "ACTIVE", gymName: "باشگاه مرکزی" },
  { id: "rel-2", partnerId: "member-2", partnerName: "سحر رضایی", status: "PAUSED", gymName: null },
];

function message(overrides: Partial<RawMessage> = {}): RawMessage {
  return {
    id: `m-${Math.random()}`,
    trainerClientId: "rel-1",
    authorId: "trainer-1",
    recipientId: "member-1",
    content: "سلام",
    createdAt: new Date("2026-08-21T10:00:00Z"),
    readAt: null,
    type: "GENERAL",
    author: { name: "سارا مربی" },
    ...overrides,
  };
}

describe("trainer ↔ student conversation builder", () => {
  it("groups all messages (roots and replies) into one chat per relationship", () => {
    const rows = [
      message({ id: "a", content: "اول", createdAt: new Date("2026-08-21T10:00:00Z") }),
      message({ id: "b", content: "دوم", authorId: "member-1", recipientId: "trainer-1", createdAt: new Date("2026-08-21T11:00:00Z"), readAt: new Date() }),
      message({ id: "orphan", trainerClientId: null }),
      message({ id: "other", trainerClientId: "rel-2", content: "گفتگوی دیگر", createdAt: new Date("2026-08-21T12:00:00Z") }),
    ];
    const conversations = buildConversations(relationships, rows, "trainer-1");
    expect(conversations).toHaveLength(2);
    // rel-2 has the newest message, so it comes first.
    expect(conversations[0].id).toBe("rel-2");
    const chat = conversations.find((item) => item.id === "rel-1");
    expect(chat?.messages.map((item) => item.body)).toEqual(["اول", "دوم"]);
    expect(chat?.messages[0].mine).toBe(true);
    expect(chat?.messages[1].mine).toBe(false);
    expect(chat?.unread).toBe(0);
    expect(chat?.subtitle).toBe("باشگاه مرکزی");
  });

  it("counts only messages addressed to the viewer as unread", () => {
    const rows = [
      message({ id: "1", recipientId: "trainer-1", readAt: null }),
      message({ id: "2", recipientId: "member-1", readAt: null }),
      message({ id: "3", recipientId: "trainer-1", readAt: new Date() }),
    ];
    const [chat] = buildConversations([relationships[0]], rows, "trainer-1");
    expect(chat.unread).toBe(1);
  });

  it("keeps at most 200 messages and produces Persian initials", () => {
    const rows = Array.from({ length: 205 }, (_, index) =>
      message({ id: `x-${index}`, createdAt: new Date(Date.UTC(2026, 7, 21, 0, 0, index)) }),
    );
    const [chat] = buildConversations([relationships[0]], rows, "trainer-1");
    expect(chat.messages).toHaveLength(200);
    expect(chat.messages.at(-1)?.id).toBe("x-204");
    expect(initialsOf("نیما احمدی")).toBe("نا");
    expect(chat.initials).toBe("نا");
  });
});
