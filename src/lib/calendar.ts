/**
 * A minimal iCalendar (RFC 5545) writer: one event per step, each with a
 * reminder at its start. Built entirely in the browser — nothing is uploaded.
 */

export interface CalendarEvent {
  title: string;
  description: string;
  start: Date;
  durationMinutes: number;
}

/** UTC date-time in the basic format RFC 5545 wants: `20261010T170000Z`. */
const formatUtc = (date: Date): string =>
  date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Escape a TEXT value (RFC 5545 §3.3.11). */
const escapeText = (text: string): string =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/**
 * Fold a content line at 75 octets, continuing with a leading space
 * (RFC 5545 §3.1). Counts UTF-8 bytes, so umlauts and "°" never get split.
 */
const fold = (line: string): string => {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  let currentBytes = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    // The first line may hold 75 octets; continuations lose one to the space.
    const limit = parts.length === 0 ? 75 : 74;
    if (currentBytes + bytes > limit) {
      parts.push(current);
      current = '';
      currentBytes = 0;
    }
    current += char;
    currentBytes += bytes;
  }
  parts.push(current);
  return parts.join('\r\n ');
};

export const buildCalendar = (
  events: readonly CalendarEvent[],
  options: { calendarName: string; url?: string; now?: Date }
): string => {
  const stamp = formatUtc(options.now ?? new Date());
  const uidBase = `${stamp}-${Math.random().toString(36).slice(2, 10)}`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//pizza-calc//dough plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(options.calendarName)}`,
    ...events.flatMap((event, index) => [
      'BEGIN:VEVENT',
      `UID:${uidBase}-${index}@pizza-calc`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${formatUtc(event.start)}`,
      `DURATION:PT${Math.max(1, Math.round(event.durationMinutes))}M`,
      `SUMMARY:${escapeText(event.title)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      ...(options.url ? [`URL:${options.url}`] : []),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(event.title)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ];

  return `${lines.map(fold).join('\r\n')}\r\n`;
};

/** Hand a text file to the browser as a download. */
export const downloadFile = (content: string, filename: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the download a moment to start before the URL goes away.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
