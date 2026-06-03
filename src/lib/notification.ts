import { notifications } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import type { SocialNotification } from "@/types/db";

export type { SocialNotification } from "@/types/db";

export async function createNotification(
  userId: string,
  notificationType: string,
  opts: Partial<Pick<SocialNotification, "actor_id" | "entity_type" | "entity_id" | "message">> = {},
): Promise<SocialNotification> {
  return notifications.create(userId, {
    notification_type: notificationType,
    actor_id: opts.actor_id ?? undefined,
    entity_type: opts.entity_type ?? undefined,
    entity_id: opts.entity_id ?? undefined,
    message: opts.message ?? undefined,
  });
}

export async function markRead(notificationId: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthenticated");
  await notifications.markRead(notificationId, user.id);
}

export async function getNotifications(limit = 30, onlyUnread = false): Promise<SocialNotification[]> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthenticated");
  const all = await notifications.listByUser(user.id, limit);
  return onlyUnread ? all.filter((n) => !n.is_read) : all;
}

export async function getUnreadCount(): Promise<number> {
  const user = await getSessionUser();
  if (!user) return 0;
  const all = await notifications.listByUser(user.id, 200);
  return all.filter((n) => !n.is_read).length;
}
