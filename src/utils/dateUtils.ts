/**
 * Utility function to ensure all numbers in a string or value are English digits (0-9).
 * Replaces Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) with standard Latin/English numerals (0123456789).
 */
export const toEnglishDigits = (str: string | number | undefined | null): string => {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
};

/**
 * Format a number to standard English digits with commas if requested
 */
export const formatEnglishNumber = (num: number | string | undefined | null, useCommas: boolean = false): string => {
  if (num === null || num === undefined || num === '') return '0';
  const cleanStr = toEnglishDigits(num);
  const parsed = Number(cleanStr);
  if (isNaN(parsed)) return cleanStr;
  return useCommas ? parsed.toLocaleString('en-US') : cleanStr;
};

/**
 * Format time in 24-hour English digits, e.g. "14:30"
 */
export const formatEnglishTime = (date: Date = new Date()): string => {
  const d = date instanceof Date ? date : new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Format date in English digits, e.g. "10/09/2026"
 */
export const formatEnglishDate = (date: Date = new Date()): string => {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Unified Date and Time format across Chat7Yemen: DD/MM/YYYY HH:mm (e.g. "10/09/2026 04:48")
 * Strictly uses English digits (0-9).
 */
export const formatUnifiedDateTime = (input?: Date | number | string | null): string => {
  if (!input) {
    const now = new Date();
    return `${formatEnglishDate(now)} ${formatEnglishTime(now)}`;
  }
  if (input instanceof Date) {
    return `${formatEnglishDate(input)} ${formatEnglishTime(input)}`;
  }
  if (typeof input === 'number') {
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
      return `${formatEnglishDate(d)} ${formatEnglishTime(d)}`;
    }
  }
  if (typeof input === 'string') {
    const clean = toEnglishDigits(input.trim());
    // If it's already in DD/MM/YYYY HH:mm or similar numerical form
    if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/.test(clean)) {
      return clean;
    }
    // If it contains ban words like 'الآن' or 'متصل', fallback to current time
    if (clean.includes('الآن') || clean.includes('متصل') || clean.includes('لحظات')) {
      const now = new Date();
      return `${formatEnglishDate(now)} ${formatEnglishTime(now)}`;
    }
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      return `${formatEnglishDate(parsed)} ${formatEnglishTime(parsed)}`;
    }
    return clean;
  }
  const now = new Date();
  return `${formatEnglishDate(now)} ${formatEnglishTime(now)}`;
};

/**
 * Format date and time in English digits: DD/MM/YYYY HH:mm, e.g. "10/09/2026 04:48"
 */
export const formatEnglishDateTime = (date: Date = new Date()): string => {
  return formatUnifiedDateTime(date);
};

/**
 * Format any message's date and time into the unified DD/MM/YYYY HH:mm format
 */
export const formatMessageDateTime = (msg: { timestamp?: string; date?: string; createdAt?: number | string }): string => {
  if (msg.createdAt) {
    return formatUnifiedDateTime(msg.createdAt);
  }
  const datePart = msg.date ? toEnglishDigits(msg.date.trim()) : formatEnglishDate(new Date());
  const timePart = msg.timestamp ? toEnglishDigits(msg.timestamp.trim()) : formatEnglishTime(new Date());

  // If timePart already has date inside it, return unified format
  if (timePart.includes('/') && timePart.includes(':')) {
    return formatUnifiedDateTime(timePart);
  }

  // Ensure 4-digit year in datePart
  let fullDate = datePart;
  if (/^\d{2}\/\d{2}$/.test(datePart)) {
    fullDate = `${datePart}/${new Date().getFullYear()}`;
  }

  // Extract pure HH:mm from timePart
  const timeMatch = timePart.match(/\d{1,2}:\d{2}/);
  const cleanTime = timeMatch ? timeMatch[0].padStart(5, '0') : formatEnglishTime(new Date());

  return `${fullDate} ${cleanTime}`;
};

/**
 * Format time and short date in English digits, e.g. "14:30 13/08"
 */
export const formatEnglishShortDateTime = (date: Date = new Date()): string => {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${formatEnglishTime(d)} ${day}/${month}`;
};

/**
 * Format time with seconds in English digits, e.g. "14:30:45"
 */
export const formatEnglishSecondsTime = (date: Date = new Date()): string => {
  const d = date instanceof Date ? date : new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Format duration in minutes into a friendly string with English digits, e.g. "5 دقائق"
 */
export const formatEnglishDuration = (minutes: number): string => {
  const m = Number(toEnglishDigits(minutes));
  if (m === 1) return `1 دقيقة`;
  if (m === 2) return `2 دقائق`;
  if (m <= 10) return `${m} دقائق`;
  if (m < 60) return `${m} دقيقة`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) return `${h} ساعة`;
  return `${h} ساعة و ${rem} دقيقة`;
};


