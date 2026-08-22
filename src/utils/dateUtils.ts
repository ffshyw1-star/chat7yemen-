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
 * Format date in English digits, e.g. "13/08/2026"
 */
export const formatEnglishDate = (date: Date = new Date()): string => {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format date and time in English digits, e.g. "14:30 - 13/08/2026"
 */
export const formatEnglishDateTime = (date: Date = new Date()): string => {
  return `${formatEnglishTime(date)} - ${formatEnglishDate(date)}`;
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


