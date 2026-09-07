import Link from "next/link";
import { MarkNotificationsRead } from "@/components/user/progress-controls";
import { NotificationSettings } from "@/components/user/notification-settings";
import { Icon, type IconName } from "@/components/icon";
import { requireCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const icons: Record<string, IconName> = { PLAN_ASSIGNED: "clipboard", FEEDBACK: "mail", SESSION_REMINDER: "calendar", SUBSCRIPTION_EXPIRING: "clock", GENERAL: "bell" };
export default async function NotificationsPage() {
  const user = await requireCurrentUser(["USER"]); const notifications = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 }); const unread = notifications.filter((item: any) => !item.readAt).length;
  return <div className="member-page"><header className="member-page__heading"><div><span>صندوق پیام</span><h1>اعلان‌ها</h1><p>به‌روزرسانی طرح‌ها، بازخوردها، جلسات و یادآورهای اشتراک.</p></div>{unread > 0 && <MarkNotificationsRead />}</header><section className="member-panel member-notifications"><NotificationSettings />{notifications.length ? notifications.map((item: any) => { const content = <><span><Icon name={icons[item.type]} size={18} /></span><div><strong>{item.title}</strong><p>{item.message}</p><small>{item.createdAt.toLocaleString("fa-IR")}</small></div>{!item.readAt && <b>جدید</b>}<Icon name="chevron" size={15} /></>; return item.href ? <Link className={item.readAt ? "" : "is-unread"} href={item.href} key={item.id}>{content}</Link> : <div className={item.readAt ? "" : "is-unread"} key={item.id}>{content}</div>; }) : <div className="member-empty"><Icon name="bell" size={26} /><h2>همه‌چیز به‌روز است</h2><p>به‌روزرسانی‌های تازه اینجا نمایش داده می‌شوند.</p></div>}</section></div>;
}
