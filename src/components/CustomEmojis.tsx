import React from 'react';
import { CustomEmojiItem } from '../types';
import { INITIAL_CUSTOM_EMOJIS } from '../data/initialData';

export interface CustomEmojiDef {
  id: string;
  name: string;
  category: string;
  component: React.FC<{ size?: number | string; className?: string; animated?: boolean }>;
  tag: string;
  isBanner?: boolean;
  imageUrl?: string;
  isCustom?: boolean;
}

// Categories list removed per user request - simple unified list
export const CUSTOM_EMOJI_CATEGORIES: { id: string; name: string }[] = [];

// Built-in list cleared per user request - only owner-uploaded stickers appear
export const CUSTOM_EMOJIS_LIST: CustomEmojiDef[] = [];

/**
 * تحويل عنصر الملصق المرفوع من المالك إلى تعريف مكون React جاهز للعرض
 */
export const convertCustomEmojiItemToDef = (item: CustomEmojiItem): CustomEmojiDef => {
  const comp: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({
    size = 32,
    className = '',
  }) => {
    if (item.imageUrl) {
      return (
        <img
          src={item.imageUrl}
          alt={item.name}
          className={`inline-block object-contain align-middle select-none max-h-[38px] max-w-[120px] rounded-sm transition-transform hover:scale-110 ${className}`}
          style={{
            height: typeof size === 'number' ? `${size}px` : size,
            width: 'auto',
          }}
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      );
    }

    if (item.bannerText) {
      return (
        <span
          className={`inline-flex items-center justify-center font-black tracking-wide select-none px-2.5 py-0.5 rounded-lg shadow-xs align-middle ${className}`}
          style={{
            background: item.bannerBg || 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1d4ed8 100%)',
            color: '#ffffff',
            border: '1.5px solid rgba(255,255,255,0.4)',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            fontSize: typeof size === 'number' ? `${Math.max(12, size * 0.5)}px` : '13px',
            fontFamily: 'serif, Tahoma, Arial',
            lineHeight: 1.2,
          }}
          title={item.name}
        >
          {item.bannerText}
        </span>
      );
    }

    return (
      <span
        className={`inline-block select-none align-middle text-center ${className}`}
        style={{ fontSize: typeof size === 'number' ? `${size * 0.8}px` : size }}
        title={item.name}
      >
        {item.emojiChar || '⭐'}
      </span>
    );
  };

  return {
    id: item.id,
    name: item.name,
    category: item.category || 'custom',
    tag: item.tag.startsWith(':') ? item.tag : `:${item.tag}:`,
    isBanner: item.isBanner,
    imageUrl: item.imageUrl,
    isCustom: true,
    component: comp,
  };
};

/**
 * الحصول على قائمة ملصقات وإيموجيات المالك المرفوعة والمخزنة
 */
export const getAllCustomEmojis = (customItems?: CustomEmojiItem[]): CustomEmojiDef[] => {
  let items = customItems;
  if (!items || items.length === 0) {
    try {
      const saved = localStorage.getItem('araby_custom_emojis');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          items = parsed;
        }
      }
    } catch {
      items = [];
    }
  }

  if (!items || items.length === 0) {
    items = INITIAL_CUSTOM_EMOJIS;
  }

  return (items || []).map(convertCustomEmojiItemToDef);
};

/**
 * دالة تحويل ومعالجة النصوص لعرض ملصقات المالك فورياً في الرسائل
 */
export const renderTextWithCustomEmojis = (
  text: string,
  size: number = 32,
  extraEmojis?: CustomEmojiItem[],
  onStickerClick?: (tag: string) => void
): React.ReactNode => {
  if (!text || typeof text !== 'string') return text;

  const customList = getAllCustomEmojis(extraEmojis);
  if (customList.length === 0) return text;

  // Regex matches any :short_tag: (supporting Arabic, English, digits, underscores, dashes)
  const regex = /(:[^\s:]+:)/g;
  const parts = text.split(regex);
  if (parts.length === 1) return text;

  return parts.map((part, idx) => {
    if (part.startsWith(':') && part.endsWith(':')) {
      const cleanTag = part.trim();
      const rawTag = cleanTag.replace(/^:+|:+$/g, '');
      const match = customList.find(
        e =>
          e.tag === cleanTag ||
          e.tag === `:${rawTag}:` ||
          e.id === rawTag ||
          `:${e.id}:` === cleanTag ||
          e.name.toLowerCase() === rawTag.toLowerCase()
      );

      if (match) {
        const Comp = match.component;
        const tagToInsert = match.tag.startsWith(':') ? match.tag : `:${match.tag}:`;
        return (
          <span
            key={`sticker-${idx}-${match.id}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onStickerClick) {
                onStickerClick(tagToInsert);
              }
              // Dispatch global event for active input in chat or private
              window.dispatchEvent(
                new CustomEvent('insert-chat-sticker', { detail: { tag: tagToInsert } })
              );
            }}
            className="inline-flex items-center align-middle mx-1 cursor-pointer transition-transform hover:scale-110 active:scale-95 select-none"
            title={`${match.name} (${tagToInsert}) - اضغط لإدراج الرمز`}
          >
            <Comp size={match.isBanner ? size : Math.max(30, size)} animated={true} />
          </span>
        );
      }
    }
    return part;
  });
};
