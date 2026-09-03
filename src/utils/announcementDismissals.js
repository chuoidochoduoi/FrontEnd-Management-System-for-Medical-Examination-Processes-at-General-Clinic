export const DISMISSED_ANNOUNCEMENTS_KEY = 'cares.home.dismissedAnnouncements.v1';

// Include only the displayed copy, not publication dates or publication status.
export const announcementSignature = item => JSON.stringify([item.title ?? '', item.content ?? '']);

export function parseDismissedAnnouncements(value) {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([id, signature]) =>
      id.length > 0 && typeof signature === 'string'));
  } catch {
    return {};
  }
}

export function readDismissedAnnouncements() {
  try {
    return parseDismissedAnnouncements(window.localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY));
  } catch {
    return {};
  }
}

export function persistAnnouncementDismissal(item) {
  const signature = announcementSignature(item);
  // Read again at click time so a dismissal in another tab is not overwritten.
  const next = { ...readDismissedAnnouncements(), [item.announcementId]: signature };
  try {
    window.localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify(next));
    return { saved: true, dismissed: next };
  } catch {
    return { saved: false, dismissed: next };
  }
}
