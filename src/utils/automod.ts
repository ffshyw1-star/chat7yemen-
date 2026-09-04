export const BAD_WORDS = [
  'كس ام', 'شرموط', 'منيوك', 'قحبة', 'عاهرة', 'خري', 'تبا لك', 'كلب', 'حمار', 'وسخ',
  't.me/', 'whatsapp.com/', 'http://', 'https://', 'bit.ly/', 'facebook.com/'
];

export function checkAutoModeration(text: string): { isViolation: boolean; reason?: string } {
  if (!text) return { isViolation: false };
  const lower = text.toLowerCase();

  // Check for bad words or spam links
  for (const word of BAD_WORDS) {
    if (lower.includes(word.toLowerCase())) {
      const isLink = word.includes('.') || word.includes('http');
      return {
        isViolation: true,
        reason: isLink ? 'حظر تلقائي بسبب نشر روابط خارجية أو إعلانات غير مسموحة 🚫' : 'حظر تلقائي بسبب استخدام ألفاظ بذيئة أو مخالفة للآداب العامة 🚫'
      };
    }
  }

  return { isViolation: false };
}
