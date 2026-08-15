/**
 * Utility function to ensure all numbers in a string are English digits (0-9).
 * Replaces Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) with standard Latin/English numerals (0123456789).
 */
export const toEnglishDigits = (str: string | number | undefined | null): string => {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
};

/**
 * Format time in 24-hour English digits, e.g. "14:30"
 */
export const formatEnglishTime = (date: Date = new Date()): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Format date in English digits, e.g. "13/08/2026"
 */
export const formatEnglishDate = (date: Date = new Date()): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
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
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${formatEnglishTime(date)} ${day}/${month}`;
};

/**
 * Format time with seconds in English digits, e.g. "14:30:45"
 */
export const formatEnglishSecondsTime = (date: Date = new Date()): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

