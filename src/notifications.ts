// Local daily reminder scheduling via expo-notifications.
// Everything here is defensive: if notifications are unavailable (or the
// native module is missing), every function resolves quietly and the app
// keeps working normally.

import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'daily-reminder';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Notifications unavailable — handler setup is best-effort.
}

/** Create the Android "daily-reminder" channel (no-op on iOS / failures). */
export async function ensureReminderChannel(): Promise<void> {
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily Reminder',
      description: 'Daily nudge to check in on your habits',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF8C42',
    });
  } catch {
    // ignore
  }
}

/** Ask the user for notification permission. True when granted. */
export async function requestReminderPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Replace any existing reminder with one daily local notification. */
export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  try {
    await ensureReminderChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Streakly 🔥',
        body: 'Time to check in on your habits — keep the streak alive!',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    // ignore — reminders are optional
  }
}

/** Cancel any scheduled reminders. */
export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}
