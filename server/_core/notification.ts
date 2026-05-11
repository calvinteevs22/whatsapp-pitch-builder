import { TRPCError } from "@trpc/server";

export type NotificationPayload = {
  title: string;
  content: string;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/**
 * No-op notification logger. Validates that title and content are non-empty,
 * then logs the notification to the console and returns true.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  if (!isNonEmptyString(payload.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(payload.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = payload.title.trim();
  const content = payload.content.trim();

  console.log("[Notification] notifyOwner called:", { title, content });

  return true;
}
