"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { useI18n } from "@/lib/i18n/language-provider";
import { formatJalali, TEHRAN_TZ, toFaDigits } from "@/lib/fa";
import type { ConversationView, MessageRole, MessageView } from "@/lib/messages";

type Props = {
  role: MessageRole;
  conversations: ConversationView[];
  viewerId: string;
  initialId?: string;
};

const QUICK_REPLIES: Record<MessageRole, { fa: string[]; en: string[] }> = {
  trainer: {
    fa: [
      "عالی بود، همین روند را ادامه بده 💪",
      "تمرین امروز را ثبت کردی؟",
      "جلسه بعدی سر وقت باش، منتظرتم!",
      "اگر درد یا خستگی داری حتماً بهم بگو.",
    ],
    en: [
      "Great work — keep it up!",
      "Did you log today's workout?",
      "See you at our next session!",
      "Tell me if anything feels sore.",
    ],
  },
  user: {
    fa: [
      "تمرین امروز را انجام دادم ✅",
      "یک سؤال درباره برنامه دارم.",
      "جلسه بعدی چه ساعتی است؟",
      "ممنون از راهنمایی‌ات!",
    ],
    en: [
      "I finished today's workout.",
      "I have a question about the plan.",
      "When is our next session?",
      "Thanks for the guidance!",
    ],
  },
};

const MAX_LENGTH = 2_000;

function shortTime(iso: string): string {
  const date = new Date(iso);
  const day = (value: Date) =>
    new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeZone: TEHRAN_TZ }).format(value);
  if (day(date) === day(new Date())) {
    return toFaDigits(
      new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", timeZone: TEHRAN_TZ }).format(date),
    );
  }
  return formatJalali(date);
}

function dayLabel(iso: string): string {
  return formatJalali(new Date(iso));
}

export function MessageInbox({ role, conversations, viewerId, initialId }: Props) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(
    initialId && conversations.some((item) => item.id === initialId)
      ? initialId
      : conversations[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [statusText, setStatusText] = useState("");
  const [extras, setExtras] = useState<Record<string, MessageView[]>>({});
  const [mobileChat, setMobileChat] = useState(Boolean(initialId));

  const searchRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const markedRef = useRef<Set<string>>(new Set());
  const readingRef = useRef<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fa");
    return conversations.filter((item) => {
      if (unreadOnly && item.unread === 0) return false;
      if (!needle) return true;
      return (
        item.name.toLocaleLowerCase("fa").includes(needle) ||
        item.subtitle.toLocaleLowerCase("fa").includes(needle) ||
        item.messages.some((message) => message.body.toLocaleLowerCase("fa").includes(needle))
      );
    });
  }, [conversations, query, unreadOnly]);

  const active = conversations.find((item) => item.id === activeId) ?? null;
  // Optimistic rows disappear as soon as the server echoes them.
  const messages = useMemo(() => {
    if (!active) return [];
    const pendingRows = (extras[active.id] ?? []).filter(
      (row) => !active.messages.some((saved) => saved.mine && saved.body === row.body),
    );
    return [...active.messages, ...pendingRows];
  }, [active, extras]);
  const totalUnread = conversations.reduce((sum, item) => sum + item.unread, 0);
  const quickReplies = QUICK_REPLIES[role][locale === "en" ? "en" : "fa"];

  // Keep new messages visible and keep the "new message" refresh subtle.
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages.length, activeId]);

  // Light live refresh: conversations stay up to date without a reload.
  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), 20_000);
    return () => window.clearInterval(timer);
  }, [router]);

  // Opening a conversation marks its messages as read (and clears the badge).
  useEffect(() => {
    if (!active || active.unread === 0) return;
    if (markedRef.current.has(active.id) || readingRef.current.has(active.id)) return;
    readingRef.current.add(active.id);
    void fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ relationshipId: active.id }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("read failed");
        markedRef.current.add(active.id);
        router.refresh();
      })
      .catch(() => {
        // A transient failure is harmless: the next open retries.
      })
      .finally(() => readingRef.current.delete(active.id));
  }, [active, router]);

  const choose = useCallback((id: string) => {
    setActiveId(id);
    setMobileChat(true);
    setPickerOpen(false);
    setStatus("idle");
    setStatusText("");
  }, []);

  const send = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      const body = draft.trim();
      if (!active || !body || pending || body.length > MAX_LENGTH) return;
      setPending(true);
      setStatus("idle");
      setStatusText("");
      const temp: MessageView = {
        id: `temp-${Date.now()}`,
        body,
        at: new Date().toISOString(),
        authorId: viewerId,
        authorName: locale === "en" ? "You" : "شما",
        mine: true,
        type: "GENERAL",
        unread: false,
      };
      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ relationshipId: active.id, content: body }),
        });
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) throw new Error(data.error || t("msg.sendError"));
        setDraft("");
        setExtras((current) => ({
          ...current,
          [active.id]: [...(current[active.id] ?? []), temp],
        }));
        setStatus("sent");
        setStatusText(t("msg.sent"));
        router.refresh();
      } catch (error) {
        setStatus("error");
        setStatusText(
          error instanceof Error && error.message ? error.message : t("msg.connectionError"),
        );
      } finally {
        setPending(false);
      }
    },
    [active, draft, locale, pending, router, t, viewerId],
  );

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }

  function applyQuickReply(text: string) {
    setDraft(text);
    setStatus("idle");
    textareaRef.current?.focus();
  }

  let lastDay = "";

  return (
    <>
      <header className="msg-hero">
        <div className="msg-hero__icon"><Icon name="mail" size={26} /></div>
        <div className="msg-hero__copy">
          <span>{role === "trainer" ? "ارتباط مربی و شاگرد" : "ارتباط با مربی"}</span>
          <h1>{t("msg.title")}</h1>
          <p>{role === "trainer" ? t("msg.subtitleTrainer") : t("msg.subtitleUser")}</p>
        </div>
        <div className="msg-hero__stats">
          <span><strong>{toFaDigits(conversations.length)}</strong><small>{role === "trainer" ? t("msg.students") : t("msg.coach")}</small></span>
          <span><strong>{toFaDigits(totalUnread)}</strong><small>{t("msg.unreadBadge")}</small></span>
          <button type="button" onClick={() => router.refresh()} title={t("msg.refresh")} aria-label={t("msg.refresh")}>
            <Icon name="clock" size={17} /> {t("msg.refresh")}
          </button>
        </div>
      </header>

      <section className={`msg-layout${mobileChat ? " is-chat" : ""}`} aria-label={t("msg.title")}>
        <aside className="msg-sidebar">
          <div className="msg-sidebar__tools">
            <label className="msg-search">
              <Icon name="search" size={17} />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("msg.search")}
                aria-label={t("msg.search")}
                type="search"
              />
            </label>
            <div className="msg-filters">
              <button className={!unreadOnly ? "active" : ""} type="button" onClick={() => setUnreadOnly(false)}>{t("msg.all")}</button>
              <button className={unreadOnly ? "active" : ""} type="button" onClick={() => setUnreadOnly(true)}>{t("msg.unreadOnly")}</button>
            </div>
          </div>

          <button
            className="msg-new"
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            aria-expanded={pickerOpen}
          >
            <Icon name="plus" size={17} /> {t("msg.newMessage")}
          </button>

          {pickerOpen && (
            <div className="msg-picker">
              <strong>{t("msg.newMessageHint")}</strong>
              {conversations.length ? conversations.map((item) => (
                <button key={item.id} type="button" onClick={() => choose(item.id)}>
                  <span className="msg-avatar msg-avatar--sm">{item.initials}</span>
                  <span>{item.name}</span>
                  <Icon name="chevron" size={14} />
                </button>
              )) : <small>{t("msg.emptyList")}</small>}
            </div>
          )}

          <div className="msg-list">
            {filtered.length ? filtered.map((item) => {
              const last = item.messages.at(-1);
              return (
                <button
                  key={item.id}
                  className={`msg-list__item${activeId === item.id ? " active" : ""}${item.unread ? " unread" : ""}`}
                  type="button"
                  onClick={() => choose(item.id)}
                >
                  <span className="msg-avatar">{item.initials}</span>
                  <span className="msg-list__body">
                    <span className="msg-list__top">
                      <strong>{item.name}</strong>
                      <small>{item.lastAt ? shortTime(item.lastAt) : ""}</small>
                    </span>
                    <span className="msg-list__preview">{last ? last.body : item.subtitle || t("msg.noMessages")}</span>
                  </span>
                  {item.unread > 0 && <b>{toFaDigits(item.unread)}</b>}
                </button>
              );
            }) : (
              <div className="msg-empty-list">
                <Icon name={query || unreadOnly ? "search" : "users"} size={24} />
                <strong>{query || unreadOnly ? t("msg.searchEmpty") : t("msg.emptyList")}</strong>
                <p>{role === "trainer" ? t("msg.emptyListTrainer") : t("msg.emptyListUser")}</p>
                {role === "trainer" ? (
                  <Link href="/trainer/students">{t("nav.myStudents")} <Icon name="arrow" size={14} /></Link>
                ) : (
                  <Link href="/user/trainers">{t("nav.findTrainers")} <Icon name="arrow" size={14} /></Link>
                )}
              </div>
            )}
          </div>
        </aside>

        <div className="msg-chat">
          {active ? (
            <>
              <header className="msg-chat__head">
                <button className="msg-back" type="button" onClick={() => setMobileChat(false)} aria-label={t("msg.back")}>
                  <Icon name="chevron" size={18} />
                </button>
                <span className="msg-avatar">{active.initials}</span>
                <div>
                  <strong>{active.name}</strong>
                  <small>
                    {active.subtitle || (role === "trainer" ? t("msg.students") : t("msg.coach"))}
                    {" · "}
                    {active.status === "PAUSED" ? t("msg.paused") : t("msg.active")}
                  </small>
                </div>
                {active.href && <Link href={active.href}>{t("msg.progress")} <Icon name="arrow" size={14} /></Link>}
              </header>

              <div className="msg-thread" ref={scrollRef} role="log" aria-live="polite" aria-relevant="additions">
                {messages.length ? messages.map((message) => {
                  const label = dayLabel(message.at);
                  const showDay = label !== lastDay;
                  lastDay = label;
                  return (
                    <div key={message.id} className="msg-thread__row">
                      {showDay && <div className="msg-day"><span>{label}</span></div>}
                      <article className={`msg-bubble${message.mine ? " mine" : ""}`}>
                        {!message.mine && <strong>{message.authorName}</strong>}
                        <p>{message.body}</p>
                        <time dateTime={message.at} title={formatJalali(new Date(message.at), { withTime: true })}>
                          {toFaDigits(new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", timeZone: TEHRAN_TZ }).format(new Date(message.at)))}
                        </time>
                      </article>
                    </div>
                  );
                }) : (
                  <div className="msg-empty-thread">
                    <Icon name="mail" size={30} />
                    <strong>{t("msg.noMessages")}</strong>
                    <p>{t("msg.noMessagesHint")}</p>
                  </div>
                )}
              </div>

              <form className="msg-composer" onSubmit={send}>
                <div className="msg-quick">
                  <small>{t("msg.quickReplies")}</small>
                  <div>
                    {quickReplies.map((text) => (
                      <button key={text} type="button" onClick={() => applyQuickReply(text)}>{text}</button>
                    ))}
                  </div>
                </div>
                <div className="msg-composer__box">
                  <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value.slice(0, MAX_LENGTH))}
                    onKeyDown={onComposerKeyDown}
                    placeholder={t("msg.composer")}
                    rows={3}
                    maxLength={MAX_LENGTH}
                    aria-label={t("msg.composer")}
                  />
                  <button className="msg-send" type="submit" disabled={pending || draft.trim().length < 2}>
                    <Icon name="arrow" size={17} />
                    {pending ? t("msg.sending") : t("msg.send")}
                  </button>
                </div>
                <div className="msg-composer__foot">
                  <span>{t("msg.hintEnter")}</span>
                  <span>{toFaDigits(MAX_LENGTH - draft.length)} {t("msg.charsLeft")}</span>
                </div>
                {status !== "idle" && (
                  <p className={status === "error" ? "msg-status error" : "msg-status success"} role="status">{statusText}</p>
                )}
              </form>
            </>
          ) : (
            <div className="msg-empty-thread msg-empty-thread--full">
              <Icon name="mail" size={32} />
              <strong>{t("msg.emptyThread")}</strong>
              <p>{t("msg.emptyThreadHint")}</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
