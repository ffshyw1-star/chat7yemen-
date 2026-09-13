import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useChat } from '../context/ChatContext';
import { Message, User } from '../types';
import { UserAvatar } from './UserAvatar';
import { UsernameDisplay } from './UsernameDisplay';
import { getRankEmoji, getRankEmojiClass, getRankTitle, getYouTubeVideoId } from '../utils/permissions';
import { Play, Pause, MoreVertical, MoreHorizontal, Flag, Trash2, Volume2, Smile, Youtube, Sparkles, Clock, Zap, Loader2, ChevronDown } from 'lucide-react';
import { ReportMessageModal } from './ReportMessageModal';
import { ImageLightboxModal } from './ImageLightboxModal';
import { NEON_COLORS } from './ProfileEditorModal';
import { toEnglishDigits, formatEnglishDate } from '../utils/dateUtils';
import { renderTextWithCustomEmojis } from './CustomEmojis';

const EMOJI_STICKER_MAP: Record<string, string> = {};
const PAGE_SIZE = 50;

// Helper to check if current page load was triggered by a browser refresh/reload
const isBrowserReload = (): boolean => {
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      return (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
    }
    return (performance as any).navigation?.type === 1;
  } catch {
    return false;
  }
};

// Helper to parse bracketed user names [ Name ] and render them in a colorful badge
const renderSystemFormattedText = (rawText: string) => {
  const parts = rawText.split(/(\[\s*[^\]]+\s*\])/g);
  return parts.map((part, idx) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      const nameContent = part.slice(1, -1).trim();
      return (
        <span
          key={idx}
          className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-black text-xs sm:text-sm shadow-xs ring-2 ring-amber-300/60"
        >
          <span>✨</span>
          <span>{nameContent}</span>
          <span>✨</span>
        </span>
      );
    }
    return part;
  });
};

// Helper to parse bracketed rank tags like [ رتبة زائر ], mentions in cyan pills as in screenshot, and greetings
const renderTextWithMentionsAndRanks = (
  rawText: string,
  users: any[],
  currentUser: any | null,
  onUserClick?: (username: string) => void,
  customEmojis?: any[],
  onStickerClick?: (tag: string) => void
) => {
  if (!rawText) return null;

  // Collect candidate usernames (sorted by length descending so longer names match first)
  const candidateUsernames: string[] = [];
  
  if (currentUser?.username && currentUser.username.trim().length >= 2) {
    candidateUsernames.push(currentUser.username.trim());
  }

  if (Array.isArray(users)) {
    users.forEach(u => {
      const uName = u?.username?.trim();
      if (uName && uName.length >= 2 && !candidateUsernames.includes(uName)) {
        candidateUsernames.push(uName);
      }
    });
  }

  // Also extract any @username mentions present in text
  const atMatches = rawText.match(/@([\w\u0600-\u06FF\s]{2,30})/g);
  if (atMatches) {
    atMatches.forEach(m => {
      const clean = m.substring(1).trim();
      if (clean && !candidateUsernames.includes(clean)) {
        candidateUsernames.push(clean);
      }
    });
  }

  candidateUsernames.sort((a, b) => b.length - a.length);

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedNames = candidateUsernames.map(name => `@?${escapeRegExp(name)}`);

  let patternStr = '(\\[\\s*رتبة\\s*[^\\]]+\\s*\\])';
  if (escapedNames.length > 0) {
    patternStr += '|(' + escapedNames.join('|') + ')';
  }

  const masterRegex = new RegExp(patternStr, 'g');
  const tokens = rawText.split(masterRegex).filter(t => t !== undefined && t !== '');

  return tokens.map((token, idx) => {
    const trimmed = token.trim();

    // 1. Rank tags like [ رتبة زائر ]
    if (/^\[\s*رتبة\s*[^\]]+\s*\]$/.test(trimmed)) {
      return (
        <span
          key={`rank-${idx}`}
          className="text-red-600 font-black mx-1 px-2 py-0.5 rounded-md bg-red-50 border border-red-200 inline-block shadow-2xs text-xs sm:text-sm"
        >
          {token}
        </span>
      );
    }

    // 2. Mentions in Solid Cyan Pill (as requested from the screenshot)
    const cleanTokenName = token.startsWith('@') ? token.substring(1).trim() : trimmed;
    const isMatchedMention = candidateUsernames.some(
      c => c.toLowerCase() === cleanTokenName.toLowerCase()
    );

    const isCurrentUsersMention = currentUser?.username && (
      currentUser.username.trim().toLowerCase() === cleanTokenName.toLowerCase() ||
      token.toLowerCase().includes(currentUser.username.trim().toLowerCase())
    );

    if (isMatchedMention || isCurrentUsersMention) {
      return (
        <span
          key={`mention-${idx}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onUserClick) {
              onUserClick(cleanTokenName);
            }
          }}
          className={`inline-block mx-1 my-0.5 px-4 py-1 rounded-full font-black text-sm sm:text-base text-white tracking-wide shadow-sm select-none transition-all duration-200 cursor-pointer text-center ${
            isCurrentUsersMention
              ? 'bg-[#00a6d6] hover:bg-[#0095c2] ring-2 ring-sky-300 ring-offset-2 ring-offset-white scale-105 animate-pulse'
              : 'bg-[#00a6d6] hover:bg-[#0095c2] hover:scale-105 active:scale-95'
          }`}
          title={`الملف الشخصي: ${cleanTokenName}`}
        >
          {token.startsWith('@') ? `@${cleanTokenName}` : cleanTokenName}
        </span>
      );
    }

    // 3. Salam greeting styling
    if (token.includes('وعليكم السلام') || token.includes('السلام عليكم')) {
      return (
        <span key={`salam-${idx}`} className="text-red-600 font-black text-sm sm:text-base mx-1">
          {token}
        </span>
      );
    }

    return <span key={`text-${idx}`}>{renderTextWithCustomEmojis(token, 28, customEmojis, onStickerClick)}</span>;
  });
};

export const ChatMessages: React.FC = () => {
  const {
    messages, currentRoom, currentUser, users,
    setSelectedUserForCard, setSelectedUserForProfile, deleteMessage,
    setInputInsertedUsername, setTargetedUserForMessage, reactToMessage, setIsProfileSettingsOpen,
    typingUsers, customEmojis, prependHistoricalMessages,
    openTextContextMenu, openImageContextMenu
  } = useChat();

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startLongPressText = (text: string, title?: string) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      openTextContextMenu(text, title);
    }, 450);
  };

  const startLongPressImage = (imageUrl: string, altText?: string) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      openImageContextMenu(imageUrl, altText);
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const [activeEmojiPickerMsgId, setActiveEmojiPickerMsgId] = useState<string | null>(null);
  const [reportingMsg, setReportingMsg] = useState<Message | null>(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState<{
    imageUrl: string;
    altText?: string;
    senderName?: string;
    timestamp?: string;
  } | null>(null);

  const handleMentionClick = (username: string) => {
    const targetUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (targetUser) {
      setSelectedUserForCard(targetUser);
    } else {
      setTargetedUserForMessage({
        userId: `user-${username}`,
        username: username
      });
    }
  };

  // Allowed older messages per role according to system specifications:
  // - visitor: 0 older messages (only current messages upon joining)
  // - member: up to 200 older messages
  // - vip: up to 500 older messages
  // - moderator / management / admin / owner / system: up to 5000 older messages
  const userRole = currentUser?.role || 'visitor';
  const canViewOldMessages = userRole !== 'visitor';
  const maxAllowedOlderMessages = userRole === 'member' ? 200 : (userRole === 'vip' ? 500 : 5000);

  // Initial visible message count: 50 messages upon entry
  const getInitialVisibleCount = useCallback(() => {
    return PAGE_SIZE; // 50 messages
  }, []);

  // Mark session as active after initial render
  useEffect(() => {
    try {
      sessionStorage.setItem('araby_chat_session_active', 'true');
    } catch {}
  }, []);

  // Lazy loading state for older messages
  const [visibleCount, setVisibleCount] = useState<number>(() => getInitialVisibleCount(currentUser?.role));
  const [hasServerOlder, setHasServerOlder] = useState<boolean>(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState<boolean>(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);
  const prevScrollHeightRef = useRef<number>(0);
  const prevScrollTopRef = useRef<number>(0);
  const isInitialMountRef = useRef<boolean>(true);

  const allRoomMessages = messages.filter(m => {
    if (m.roomId !== currentRoom.id) return false;
    if (m.id.startsWith('sys-exit-') || (m.id.startsWith('evt-leave-') && (m as any).type === 'system')) return false;
    if ((m as any).type === 'system' && m.text?.includes('غادر')) return false;
    return true;
  });
  const totalRoomMessagesCount = allRoomMessages.length;

  // Display only the most recent `visibleCount` messages
  const displayedMessages = allRoomMessages.slice(Math.max(0, totalRoomMessagesCount - visibleCount));
  const hasMoreOlder = canViewOldMessages && (visibleCount < totalRoomMessagesCount || hasServerOlder) && visibleCount < maxAllowedOlderMessages;

  // Listen for global scroll to bottom events (e.g. keyboard open or input focus)
  useEffect(() => {
    const handleScrollBottomEvent = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    };
    window.addEventListener('chat-scroll-bottom', handleScrollBottomEvent);
    return () => window.removeEventListener('chat-scroll-bottom', handleScrollBottomEvent);
  }, []);

  // Reset pagination when room changes
  const prevRoomIdRef = useRef<string>(currentRoom.id);
  useEffect(() => {
    if (prevRoomIdRef.current !== currentRoom.id) {
      prevRoomIdRef.current = currentRoom.id;
      setVisibleCount(PAGE_SIZE);
      setHasServerOlder(true);
      setIsLoadingOlder(false);
      setShowScrollBottomBtn(false);
      setPullDistance(0);
      setIsPulling(false);

      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [currentRoom.id]);

  // Handle incoming new messages: auto-expand visibleCount to keep incoming stream visible
  const prevMsgLengthRef = useRef<number>(allRoomMessages.length);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const diff = allRoomMessages.length - prevMsgLengthRef.current;
    prevMsgLengthRef.current = allRoomMessages.length;

    if (diff > 0) {
      // Add incoming new messages count to visibleCount so they appear without truncation
      setVisibleCount(prev => prev + diff);

      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceFromBottom < 220 || isInitialMountRef.current) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        isInitialMountRef.current = false;
      }
    }
  }, [allRoomMessages.length]);

  // Function to load more older messages (50 at a time) with scroll position retention
  // Allowed up to role limit: Member (200), VIP (500), Staff (5000)
  const loadMoreOlderMessages = useCallback(async () => {
    if (!canViewOldMessages || isLoadingOlder || !hasMoreOlder || visibleCount >= maxAllowedOlderMessages) return;

    const container = scrollContainerRef.current;
    if (container) {
      prevScrollHeightRef.current = container.scrollHeight;
      prevScrollTopRef.current = container.scrollTop;
    }

    setIsLoadingOlder(true);

    // Case 1: If there are unrendered messages in memory for this room, reveal them first
    if (visibleCount < totalRoomMessagesCount) {
      setTimeout(() => {
        setVisibleCount(prev => Math.min(maxAllowedOlderMessages, Math.min(totalRoomMessagesCount, prev + PAGE_SIZE)));
        setIsLoadingOlder(false);
        setPullDistance(0);
        setIsPulling(false);

        // Restore exact scroll offset so content doesn't jump
        requestAnimationFrame(() => {
          if (container) {
            const heightDifference = container.scrollHeight - prevScrollHeightRef.current;
            container.scrollTop = prevScrollTopRef.current + heightDifference;
          }
        });
      }, 300);
      return;
    }

    // Case 2: All in-memory messages are already visible, fetch older archived messages from server
    try {
      const earliestMsg = allRoomMessages[0];
      const beforeTimestamp = earliestMsg ? (earliestMsg.createdAt || earliestMsg.timestamp) : undefined;
      const url = new URL('/api/messages/history', window.location.origin);
      url.searchParams.set('roomId', currentRoom.id);
      url.searchParams.set('role', currentUser?.role || '');
      const allowedRemaining = maxAllowedOlderMessages - visibleCount;
      const fetchLimit = Math.min(PAGE_SIZE, allowedRemaining);
      url.searchParams.set('limit', String(fetchLimit));
      if (beforeTimestamp) {
        url.searchParams.set('beforeTimestamp', String(beforeTimestamp));
      }

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
        prependHistoricalMessages(data.messages);
        const addedCount = Math.min(data.messages.length, allowedRemaining);
        setVisibleCount(prev => Math.min(maxAllowedOlderMessages, prev + addedCount));
        setHasServerOlder(Boolean(data.hasMore && (visibleCount + addedCount < maxAllowedOlderMessages)));
      } else {
        setHasServerOlder(false);
      }
    } catch (err) {
      console.warn('Failed to load older messages from history API:', err);
      setHasServerOlder(false);
    } finally {
      setIsLoadingOlder(false);
      setPullDistance(0);
      setIsPulling(false);

      requestAnimationFrame(() => {
        if (container) {
          const heightDifference = container.scrollHeight - prevScrollHeightRef.current;
          container.scrollTop = prevScrollTopRef.current + heightDifference;
        }
      });
    }
  }, [canViewOldMessages, isLoadingOlder, hasMoreOlder, visibleCount, maxAllowedOlderMessages, totalRoomMessagesCount, allRoomMessages, currentRoom.id, currentUser?.role, prependHistoricalMessages]);

  // Touch handlers for Pull-Down gesture to reveal older messages (only for authorized roles)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!canViewOldMessages) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    if (container.scrollTop <= 10) {
      touchStartYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    } else {
      isPullingRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!canViewOldMessages || !isPullingRef.current || isLoadingOlder || !hasMoreOlder) return;
    const container = scrollContainerRef.current;
    if (!container || container.scrollTop > 10) {
      isPullingRef.current = false;
      setPullDistance(0);
      setIsPulling(false);
      return;
    }

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartYRef.current;

    if (deltaY > 0) {
      // Apply spring dampening
      const dampedDistance = Math.min(80, Math.pow(deltaY, 0.82) * 1.6);
      setPullDistance(dampedDistance);
      setIsPulling(true);
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const handleTouchEnd = () => {
    if (isPullingRef.current && pullDistance >= 40 && hasMoreOlder && !isLoadingOlder) {
      loadMoreOlderMessages();
    }
    isPullingRef.current = false;
    setPullDistance(0);
    setIsPulling(false);
  };

  // Scroll listener: triggers progressive lazy loading when scrolling up near top
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceFromTop = target.scrollTop;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

    // Show floating scroll to bottom button if user scrolled up
    setShowScrollBottomBtn(distanceFromBottom > 350);

    // Trigger lazy loading when near the top (< 80px) for authorized roles
    if (distanceFromTop <= 80 && canViewOldMessages && hasMoreOlder && !isLoadingOlder) {
      loadMoreOlderMessages();
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Toggle voice playback
  const handleToggleVoice = (msgId: string, mediaUrl?: string) => {
    if (!mediaUrl) return;
    if (playingVoiceId === msgId) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(msgId);
      const audio = new Audio(mediaUrl);
      audio.play().catch(() => {});
      audio.onended = () => setPlayingVoiceId(null);
    }
  };

  // Click on username -> targets user in input bar AND places name directly into "اكتب هنا" box
  const handleUsernameClick = (name: string, senderId?: string, senderRole?: string, senderAvatar?: string) => {
    const foundUser = users.find(u => (senderId && u.id === senderId) || u.username.toLowerCase() === name.toLowerCase());
    const finalUname = foundUser?.username || name;
    setTargetedUserForMessage({
      userId: foundUser?.id || senderId || `user-${name}`,
      username: finalUname,
      role: foundUser?.role || senderRole,
      avatar: foundUser?.avatar || senderAvatar
    });
    setInputInsertedUsername(finalUname);
    window.dispatchEvent(new CustomEvent('insert-username-to-input', { detail: { username: finalUname } }));
  };


  // Click on avatar -> opens User Card popover
  const handleAvatarClick = (senderId: string) => {
    const foundUser = users.find(u => u.id === senderId);
    if (foundUser) {
      setSelectedUserForCard(foundUser);
    }
  };

  // Click on a user name or profile specifically (e.g., from system mute/kick announcements)
  const handleOpenUserProfileByNameOrId = (usernameOrId: string) => {
    const trimmed = usernameOrId.trim();
    const foundUser = users.find(u => u.id === trimmed || u.username.toLowerCase() === trimmed.toLowerCase());
    if (foundUser) {
      setSelectedUserForProfile(foundUser);
      setSelectedUserForCard(null);
    } else {
      // If user left or temporary, create fallback object so modal still opens
      setSelectedUserForProfile({
        id: `user-temp-${Date.now()}`,
        username: trimmed,
        role: 'member',
        gender: 'female',
        age: 20,
        country: 'اليمن',
        currentRoomId: currentRoom.id,
        joinedDate: formatEnglishDate(new Date()),
        joinedTimestamp: Date.now(),
        lastSeen: 'الآن',
        coins: 0,
        likes: 0,
        privatePrivacy: 'everyone',
        onlineStatus: 'online'
      });
      setSelectedUserForCard(null);
    }
  };

  const isModOrHigher = currentUser && ['moderator', 'management', 'admin', 'owner'].includes(currentUser.role);

  // Assign distinct aesthetic username colors matching screenshot
  const getUsernameColor = (msg: Message) => {
    const sender = (currentUser && (currentUser.id === msg.senderId || currentUser.username === msg.senderName) ? currentUser : null) || users.find(u => u.id === msg.senderId || u.username === msg.senderName);
    if (sender?.usernameColor) return sender.usernameColor;
    if (msg.senderUsernameColor) return msg.senderUsernameColor;
    if (msg.senderName.includes('غزااالة')) return '#e11d48'; // Bright Rose/Red
    if (msg.senderName.includes('زروج')) return '#be123c'; // Dark Rose
    if (msg.senderName.includes('بحر الهوى')) return '#854d0e'; // Brown/Amber
    if (msg.senderName.includes('ibtisām') || msg.senderName.includes('Ibtisām')) return '#475569'; // Slate
    switch (sender?.role || msg.senderRole) {
      case 'owner': return '#e11d48'; // Rose red
      case 'admin': return '#ea580c'; // Orange
      case 'management': return '#d97706'; // Amber/Gold
      case 'moderator': return '#2563eb'; // Royal Blue
      case 'vip': return '#0284c7'; // Cyan
      case 'member': return '#059669'; // Emerald
      default: return '#334155'; // Dark slate
    }
  };

  const [isTopicBannerOpen, setIsTopicBannerOpen] = useState(true);
  const [topicAnchorMsgId, setTopicAnchorMsgId] = useState<string | null>(null);
  const [activePlayingYtId, setActivePlayingYtId] = useState<string | null>(null);

  // Always show the room topic message whenever entering the room or refreshing, anchored after the last message
  useEffect(() => {
    setIsTopicBannerOpen(true);
    const roomMsgs = messages.filter(m => m.roomId === currentRoom.id);
    const lastMsg = roomMsgs.length > 0 ? roomMsgs[roomMsgs.length - 1] : null;
    setTopicAnchorMsgId(lastMsg ? lastMsg.id : null);
  }, [currentRoom.id]);

  const renderTopicBanner = () => {
    if (!isTopicBannerOpen) return null;
    return (
      <div
        key="room-topic-banner-item"
        id="room-topic-banner"
        dir="rtl"
        className="bg-[#e6f7ef] border-y border-emerald-200/90 px-3.5 py-2.5 flex items-center justify-between shadow-2xs select-none animate-in fade-in duration-200"
      >
        {/* Right Side: Envelope Alert Icon + Topic Details */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-9 h-9 rounded-full bg-white border border-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
            <span className="text-lg">✉️</span>
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 border border-white flex items-center justify-center text-[8px] font-black text-slate-950">
              !
            </span>
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-extrabold text-slate-900 leading-tight">
              الموضوع
            </span>
            <p className="text-[12px] font-bold text-emerald-900 truncate">
              {currentRoom.topic || `اهلا وسهلا بكم في ${currentRoom.name} ${currentRoom.flag || '🇾🇪'}`}
            </p>
          </div>
        </div>

        {/* Left Side: Close Button */}
        <button
          type="button"
          onClick={() => setIsTopicBannerOpen(false)}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-emerald-200/60 rounded-full transition-colors cursor-pointer shrink-0"
          title="إخفاء شريط الموضوع"
        >
          <span className="text-slate-600 font-black text-sm">✕</span>
        </button>
      </div>
    );
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y bg-white custom-scrollbar text-slate-800 flex flex-col relative"
    >
      {/* Top Section: Visitor Welcome */}
      <div className="shrink-0">
        {/* Visitor Room Welcome Banner */}
        {currentUser?.role === 'visitor' && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-orange-500/10 border-b border-amber-200 p-3 dir-rtl flex flex-col sm:flex-row items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 text-sm shadow-xs">
                👤
              </div>
              <div>
                <p className="text-xs font-bold text-amber-950">
                  مرحباً بك كزائر ({currentUser.username}) في {currentRoom.name} {currentRoom.flag}
                </p>
                <p className="text-[11px] text-amber-900/80 font-semibold">
                  يمكنك الدردشة والتفاعل والتعبير عن رأيك. لإنشاء حساب دائم وحفظ رتبتك واسمك، اضغط على زر التسجيل.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsProfileSettingsOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <span>تسجيل حساب عضو ⭐</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Messages List: Starts from bottom with mt-auto */}
      <div className="flex-1 flex flex-col justify-end mt-auto min-h-0 divide-y divide-slate-100/90">
        {displayedMessages.length === 0 ? (
          renderTopicBanner()
        ) : (
          displayedMessages.map((msg, msgIndex) => {
            const isAnchoredHere = isTopicBannerOpen && (
              msg.id === topicAnchorMsgId ||
              (topicAnchorMsgId === null && msgIndex === 0) ||
              (topicAnchorMsgId && !displayedMessages.some(m => m.id === topicAnchorMsgId) && msgIndex === 0)
            );

            // Dedicated Room Event: Join / Leave Room Notification
            const isRoomEvent = (msg as any).type === 'room_event' ||
              ((msg as any).type === 'system' && (msg.text?.includes('انضم للغرفة') || msg.text?.includes('غادر الغرفة')));

            if (isRoomEvent) {
              const isJoin = (msg as any).eventType ? (msg as any).eventType === 'join' : !msg.text?.includes('غادر');
              const targetUname = (msg as any).username || msg.senderName || (msg.text ? msg.text.split(' ')[0] : 'مستخدم');
              const targetUid = (msg as any).userId || msg.senderId;
              const senderUser = users.find(u => u.id === targetUid || u.username === targetUname);
              const rawRank = (msg as any).rank || msg.senderRole || senderUser?.role || 'member';
              const roleTitle = getRankTitle(rawRank);
              const rankEmoji = getRankEmoji(rawRank as any);
              const userColor = senderUser?.usernameColor || msg.senderUsernameColor || '#0284c7';

              return (
                <React.Fragment key={msg.id}>
                  <div
                    id={`room-event-${msg.id}`}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-50/60 hover:bg-slate-100/70 border-y border-slate-100/90 transition-colors group relative dir-rtl my-0.5 select-none"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 flex-wrap">
                      {/* Left arrow indicator */}
                      <span className="text-slate-400 font-bold text-sm select-none shrink-0">
                        &gt;
                      </span>

                      {/* Event bracket prefix: [ انظم المستخدم / [ غادر المستخدم */}
                      <span className="text-slate-700 font-bold text-xs sm:text-sm shrink-0">
                        [ {isJoin ? 'انظم المستخدم' : 'غادر المستخدم'}
                      </span>

                      {/* Clickable Username -> places username into "اكتب هنا" input box & targets user */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUsernameClick(targetUname, targetUid, rawRank, senderUser?.avatar || msg.senderAvatar);
                        }}
                        style={{ color: userColor }}
                        className="font-black text-sm sm:text-base hover:underline cursor-pointer transition-all hover:opacity-85 shrink-0 inline-flex items-center gap-1 px-1 py-0.5 rounded hover:bg-slate-100"
                        title={`إدراج ${targetUname} في مربع اكتب هنا`}
                      >
                        <span>{targetUname}</span>
                        {rankEmoji && <span className="text-xs">{rankEmoji}</span>}
                      </button>

                      {/* Event bracket suffix: الى الغرفة ] / الغرفة ] */}
                      <span className="text-slate-700 font-bold text-xs sm:text-sm shrink-0">
                        {isJoin ? 'الى الغرفة ]' : 'الغرفة ]'}
                      </span>

                      {/* Rank Badge */}
                      <span className="text-red-600 font-black px-2 py-0.5 rounded-md bg-red-50 border border-red-200 inline-block shadow-2xs text-xs sm:text-sm shrink-0">
                        [رتبة {roleTitle}]
                      </span>
                    </div>


                    {/* Timestamp & Moderation delete */}
                    <div className="flex items-center gap-2 text-slate-400 shrink-0 self-center dir-ltr">
                      {currentUser && isModOrHigher && (
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                          title="حذف الإشعار"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="text-[10px] sm:text-xs text-slate-400 font-semibold font-sans">
                        {toEnglishDigits(msg.timestamp || '')}
                      </span>
                    </div>
                  </div>
                  {isAnchoredHere && renderTopicBanner()}
                </React.Fragment>
              );
            }

            if (msg.type === 'system') {
              const isWelcome = msg.id.includes('welcome') || msg.text.includes('قوانين وتعليمات الغرفة') || msg.senderName.includes('الروبوت');
              const cleanText = msg.text.replace(/\*\*(.*?)\*\*/g, '$1');

              if (isWelcome) {
                return (
                  <React.Fragment key={msg.id}>
                    <div className="py-2.5 px-3 flex justify-center bg-gradient-to-b from-sky-50/40 to-white dir-rtl">
                      <div className="bg-gradient-to-br from-sky-50 via-white to-amber-50/40 border border-sky-200/80 rounded-2xl p-4 max-w-xl w-full shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sm">
                              🤖
                            </span>
                            <div>
                              <span className="text-xs font-black text-sky-900 block">رسالة الترحيب الآلية والقوانين</span>
                              <span className="text-[10px] font-bold text-sky-600">شات اليمن المطور • {currentRoom.name} {currentRoom.flag}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 font-mono bg-white px-2 py-0.5 rounded-full border border-slate-100">
                            {toEnglishDigits(msg.timestamp)} {toEnglishDigits(msg.date ? msg.date.substring(0, 5) : '22/08')}
                          </span>
                        </div>

                        <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line space-y-1 font-medium">
                          {cleanText}
                        </div>
                      </div>
                    </div>
                    {isAnchoredHere && renderTopicBanner()}
                  </React.Fragment>
                );
              }

              return (
                <React.Fragment key={msg.id}>
                  <div className="py-2 px-3 flex justify-center bg-slate-50/50 dir-rtl">
                    <div className="bg-sky-100/90 border border-sky-200 text-sky-900 text-xs sm:text-sm px-4 py-2 rounded-2xl max-w-xl text-center shadow-2xs font-medium whitespace-pre-line leading-relaxed">
                      {cleanText}
                    </div>
                  </div>
                  {isAnchoredHere && renderTopicBanner()}
                </React.Fragment>
              );
            }

            // Check if message is a System moderation announcement
            const isSystemAnnouncement = msg.senderId === 'user-system' || msg.senderName === 'System';
            
            if (isSystemAnnouncement) {
              let penalizedName = '';
              if (msg.targetUserId) {
                const u = users.find(usr => usr.id === msg.targetUserId);
                if (u) penalizedName = u.username;
              }
              if (!penalizedName) {
                if (msg.text.includes('\n')) {
                  penalizedName = msg.text.split('\n')[0].trim();
                } else if (msg.text.includes('العضو:')) {
                  const after = msg.text.split('العضو:')[1];
                  penalizedName = after.split('|')[0].trim();
                } else if (msg.text.includes('على "')) {
                  penalizedName = msg.text.split('على "')[1].split('"')[0].trim();
                }
              }

              const targetUserObj = penalizedName ? (users.find(u => u.username === penalizedName || u.id === msg.targetUserId)) : null;

              return (
                <React.Fragment key={msg.id}>
                  <div
                    className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3 hover:bg-slate-50/70 transition-colors group relative dir-rtl"
                  >
                    {/* Right Side: Alert Icon / Avatar + System & Target details */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        onClick={() => {
                          if (targetUserObj) {
                            setSelectedUserForProfile(targetUserObj);
                            setSelectedUserForCard(null);
                          } else if (penalizedName) {
                            handleOpenUserProfileByNameOrId(penalizedName);
                          }
                        }}
                        className="shrink-0 w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-lg border border-slate-700 shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                        title={penalizedName ? `عرض ملف ${penalizedName}` : 'System'}
                      >
                        <span className="text-white text-xl">❗</span>
                      </div>

                      <div className="flex flex-col text-right min-w-0 pr-0.5">
                        <span className="font-extrabold text-sm sm:text-base text-[#e11d48] tracking-tight text-right w-fit">
                          System
                        </span>

                        <div className="mt-0.5 text-xs sm:text-sm text-slate-500 font-bold flex items-center gap-1.5 flex-wrap">
                          {penalizedName ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (targetUserObj) {
                                  setSelectedUserForProfile(targetUserObj);
                                  setSelectedUserForCard(null);
                                } else {
                                  handleOpenUserProfileByNameOrId(penalizedName);
                                }
                              }}
                              className="text-slate-800 hover:text-red-600 font-extrabold hover:underline cursor-pointer transition-colors"
                              title={`عرض الملف الشخصي لـ ${penalizedName}`}
                            >
                              {penalizedName}
                            </button>
                          ) : null}
                          <span className="text-slate-400 font-medium">arabsyemen.com</span>
                          {msg.text.includes('تم كتم') && <span className="text-amber-600 font-bold">(تم الكتم)</span>}
                          {msg.text.includes('تم طرد') && <span className="text-red-600 font-bold">(تم الطرد)</span>}
                          {msg.text.includes('تم حظر') && <span className="text-purple-600 font-bold">(تم الحظر)</span>}
                        </div>
                      </div>
                    </div>

                    {/* Left Side: Timestamp & 3 dots */}
                    <div className="flex items-center gap-2 text-slate-400 shrink-0 self-start pt-1 dir-ltr">
                      {/* 3 Dots Menu Button */}
                      {currentUser && isModOrHigher && (
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                          title="حذف الإشعار"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="text-[11px] sm:text-xs text-slate-400 font-semibold font-sans">
                        {toEnglishDigits(msg.timestamp)} {toEnglishDigits(msg.date ? msg.date.substring(0, 5) : '22/08')}
                      </span>
                    </div>
                  </div>
                  {isAnchoredHere && renderTopicBanner()}
                </React.Fragment>
              );
            }

            const isMe = currentUser?.id === msg.senderId;
            const senderUser = (isMe ? currentUser : null) || users.find(u => u.id === msg.senderId || u.username === msg.senderName);
            const userColor = senderUser?.usernameColor || getUsernameColor(msg);
            const userBgGradient = senderUser?.usernameBgGradient || msg.senderUsernameBgGradient;
            const senderAvatar = senderUser?.avatar || (isMe ? currentUser?.avatar : undefined) || msg.senderAvatar;
            const senderRole = senderUser?.role || msg.senderRole;
            const senderGender = senderUser?.gender || msg.senderGender;
            const senderFontSize = senderUser?.usernameFontSize || msg.senderUsernameFontSize;
            const isJoinMessage = msg.text.includes('انضم للغرفة');

            // Requirement 4 & 5: Unified, persistent message styling based on sender's latest saved preferences
            const senderMsgBg = senderUser?.chatTextBgGradient || (isMe ? currentUser?.chatTextBgGradient : undefined) || msg.textBgGradient;
            const senderMsgColor = senderUser?.chatTextColor || (isMe ? currentUser?.chatTextColor : undefined) || msg.textColor || '#1e293b';
            const senderMsgFont = senderUser?.chatFontFamily || (isMe ? currentUser?.chatFontFamily : undefined) || msg.fontFamily;
            const senderMsgWeight = senderUser?.chatTextWeight || (isMe ? currentUser?.chatTextWeight : undefined) || msg.textWeight;
            const senderMsgStyle = senderUser?.chatFontStyle || (isMe ? currentUser?.chatFontStyle : undefined) || msg.textStyle;
            const senderMsgNeon = (senderUser?.chatIsNeon !== undefined ? senderUser.chatIsNeon : (isMe ? currentUser?.chatIsNeon : undefined)) ?? msg.isNeon;

            return (
              <React.Fragment key={msg.id}>
                <div
                  className="flex items-start justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3 hover:bg-slate-50/60 transition-colors group relative dir-rtl"
                >
                {/* 1. Right Side (RTL Start): User Avatar & Text Details */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Far Right: Circular User Avatar matching screenshot */}
                  <button
                    onClick={() => handleAvatarClick(msg.senderId)}
                    className="shrink-0 transition-transform active:scale-95 cursor-pointer mt-0.5"
                    title={`عرض كرت ${msg.senderName}`}
                  >
                    <UserAvatar
                      avatarUrl={senderAvatar}
                      gender={senderGender}
                      role={senderRole}
                      username={msg.senderName}
                      size="md"
                    />
                  </button>

                  {/* Text Block aligned to the Right */}
                  <div className="flex flex-col text-right min-w-0 pr-0.5">
                    {/* Line 1: Username with responsive Circular Rank Badge */}
                    <div className="flex items-center gap-1.5 w-fit">
                      <UsernameDisplay
                        username={msg.senderName}
                        role={senderRole}
                        showRankBadge={true}
                        customRoleBadge={senderUser?.customRoleBadge}
                        badgeSize="sm"
                        usernameColor={userColor}
                        usernameBgGradient={userBgGradient}
                        isNeon={senderUser?.isNeon || NEON_COLORS.some(n => n.value.toLowerCase() === (userColor || '').toLowerCase())}
                        fontSize={senderFontSize}
                        onClick={() => handleUsernameClick(msg.senderName, msg.senderId, msg.senderRole, msg.senderAvatar)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          openTextContextMenu(msg.senderName, `اسم المستخدم: ${msg.senderName}`);
                        }}
                        onTouchStart={() => startLongPressText(msg.senderName, `اسم المستخدم: ${msg.senderName}`)}
                        onTouchEnd={cancelLongPress}
                        onTouchCancel={cancelLongPress}
                        className="hover:underline cursor-pointer tracking-tight text-right leading-tight"
                        title="اضغط للتحديد (أو اضغط مطولاً للنسخ والخيارات)"
                      />
                    </div>

                    {/* Line 2: Message Content or Join Badge */}
                    <div className="mt-1">
                      {isJoinMessage ? (
                        /* System User Join Pill/Badge matching Screenshot */
                        <div
                          onContextMenu={(e) => {
                            e.preventDefault();
                            openTextContextMenu(msg.text, 'رسالة النظام');
                          }}
                          onTouchStart={() => startLongPressText(msg.text, 'رسالة النظام')}
                          onTouchEnd={cancelLongPress}
                          onTouchCancel={cancelLongPress}
                          className="bg-[#e0f2fe] border border-sky-200 text-[#0369a1] text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full shadow-2xs my-0.5 inline-flex items-center gap-1 dir-rtl cursor-pointer"
                        >
                          <span>هذا المستخدم انضم للغرفة</span>
                          {msg.text.includes('[') && (
                            <span className="text-red-600 font-black">
                              [{msg.text.split('[')[1]}
                            </span>
                          )}
                        </div>
                      ) : (
                        /* Regular Message Text with Message Box Background (المربع بالكامل) */
                        msg.type === 'text' && (
                          <div
                            id={`message-box-${msg.id}`}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              openTextContextMenu(msg.text, `رسالة من ${msg.senderName}`);
                            }}
                            onTouchStart={() => startLongPressText(msg.text, `رسالة من ${msg.senderName}`)}
                            onTouchEnd={cancelLongPress}
                            onTouchCancel={cancelLongPress}
                            style={{
                              backgroundColor: senderMsgBg && !senderMsgBg.startsWith('linear-gradient') ? senderMsgBg : undefined,
                              backgroundImage: senderMsgBg && senderMsgBg.startsWith('linear-gradient') ? senderMsgBg : undefined,
                              borderRadius: senderMsgBg ? '12px' : undefined,
                              padding: senderMsgBg ? '8px 14px' : '1px 0',
                              border: senderMsgBg ? '1px solid rgba(0,0,0,0.1)' : undefined,
                              boxShadow: senderMsgBg ? '0 2px 6px rgba(0,0,0,0.08)' : undefined,
                              display: senderMsgBg ? 'inline-block' : 'block',
                              maxWidth: '100%',
                            }}
                            className={`message-box transition-all dir-rtl cursor-pointer select-text ${
                              senderMsgBg ? 'my-1 rounded-xl shadow-xs' : 'my-0.5'
                            }`}
                          >
                            <div
                              id={`message-text-${msg.id}`}
                              style={{
                                color: senderMsgColor || undefined,
                                fontSize: msg.textFontSize || undefined,
                                fontFamily: senderMsgFont || undefined,
                                fontWeight: senderMsgWeight === 'heavy' || senderMsgWeight === '900' ? 900 : senderMsgWeight === 'bold' || senderMsgWeight === '700' ? 700 : undefined,
                                fontStyle: senderMsgStyle === 'italic' ? 'italic' : undefined,
                                textShadow: senderMsgNeon || (senderMsgColor && NEON_COLORS.some(n => n.value.toLowerCase() === (senderMsgColor || '').toLowerCase()))
                                  ? `0 0 8px ${senderMsgColor || '#00f3ff'}, 0 0 16px ${senderMsgColor || '#00f3ff'}, 0 0 2px #000`
                                  : undefined
                              }}
                              className={`message-text text-sm sm:text-base leading-relaxed break-words transition-all ${
                                msg.text.includes('وعليكم السلام') ? 'text-red-600 font-black text-lg' : 'font-medium'
                              }`}
                            >
                              {renderTextWithMentionsAndRanks(msg.text, users, currentUser, handleMentionClick, customEmojis, (tag) => setInputInsertedUsername(tag))}
                            </div>
                          </div>
                        )
                      )}

                      {/* YouTube Video Message Card */}
                      {(msg.type === 'youtube' || (msg.mediaUrl && getYouTubeVideoId(msg.mediaUrl)) || getYouTubeVideoId(msg.text)) && (() => {
                        const ytId = msg.type === 'youtube'
                          ? (msg.mediaUrl || getYouTubeVideoId(msg.text) || 'wD2l3r9O1zA')
                          : (getYouTubeVideoId(msg.mediaUrl) || getYouTubeVideoId(msg.text) || 'wD2l3r9O1zA');
                        const isPlayingThisYt = activePlayingYtId === msg.id;

                        return (
                          <div className="mt-2 max-w-sm sm:max-w-md w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md">
                            {isPlayingThisYt ? (
                              <div className="relative aspect-video w-full bg-black">
                                <iframe
                                  src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1`}
                                  title={msg.text || 'فيديو يوتيوب'}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                                <button
                                  onClick={() => setActivePlayingYtId(null)}
                                  className="absolute top-2 left-2 bg-black/70 hover:bg-black text-white text-[10px] px-2 py-1 rounded-lg font-bold cursor-pointer"
                                >
                                  تصغير ✕
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => setActivePlayingYtId(msg.id)}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  openImageContextMenu(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`, msg.text || 'YouTube Video');
                                }}
                                onTouchStart={() => startLongPressImage(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`, msg.text || 'YouTube Video')}
                                onTouchEnd={cancelLongPress}
                                onTouchCancel={cancelLongPress}
                                className="relative aspect-video w-full bg-slate-950 group cursor-pointer overflow-hidden"
                                title="اضغط لتشغيل الفيديو في الشات ▶️"
                              >
                                <img
                                  src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                                  alt={msg.text || 'YouTube Video'}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop';
                                  }}
                                  referrerPolicy="no-referrer"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-14 h-10 bg-[#ff0000] hover:bg-[#cc0000] text-white rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 active:scale-95 transition-all duration-200 ring-4 ring-black/40">
                                    <Play className="w-6 h-6 fill-white text-white translate-x-0.5" />
                                  </div>
                                </div>

                                <div className="absolute bottom-0 inset-x-0 p-2.5 flex items-center justify-between text-white text-xs font-bold bg-black/60 backdrop-blur-xs">
                                  <span className="truncate flex-1 ml-2 font-sans">
                                    {msg.text && msg.text !== ytId ? msg.text : 'مقطع من YouTube 📺'}
                                  </span>
                                  <div className="flex items-center gap-1 text-[10px] bg-red-600 px-1.5 py-0.5 rounded font-black">
                                    <span>YouTube</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Media Attachments */}
                      {msg.type === 'image' && msg.mediaUrl && (
                        <div className="mt-1">
                          {msg.mediaUrl.includes('notoemoji') || msg.mediaUrl.endsWith('.webp') || msg.mediaUrl.endsWith('.gif') ? (
                            <div
                              className="inline-block p-1 cursor-pointer"
                              onClick={() => {
                                setActiveLightboxImage({
                                  imageUrl: msg.mediaUrl!,
                                  altText: 'ملصق متحرك',
                                  senderName: msg.senderName,
                                  timestamp: msg.timestamp
                                });
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                openImageContextMenu(msg.mediaUrl!, 'ملصق متحرك');
                              }}
                              onTouchStart={() => startLongPressImage(msg.mediaUrl!, 'ملصق متحرك')}
                              onTouchEnd={cancelLongPress}
                              onTouchCancel={cancelLongPress}
                            >
                              <img
                                src={msg.mediaUrl}
                                alt="ملصق متحرك"
                                className="w-24 h-24 sm:w-28 sm:h-28 object-contain hover:scale-110 transition-transform cursor-pointer drop-shadow-md"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="relative group/img inline-block">
                              <img
                                src={msg.mediaUrl}
                                alt="مرفق صورة"
                                onClick={() => {
                                  setActiveLightboxImage({
                                    imageUrl: msg.mediaUrl!,
                                    altText: `صورة من ${msg.senderName}`,
                                    senderName: msg.senderName,
                                    timestamp: msg.timestamp
                                  });
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  openImageContextMenu(msg.mediaUrl!, `صورة من ${msg.senderName}`);
                                }}
                                onTouchStart={() => startLongPressImage(msg.mediaUrl!, `صورة من ${msg.senderName}`)}
                                onTouchEnd={cancelLongPress}
                                onTouchCancel={cancelLongPress}
                                className="max-h-64 sm:max-h-72 rounded-2xl object-contain bg-slate-100/80 border border-slate-200 shadow-sm cursor-zoom-in hover:brightness-95 hover:shadow-md transition-all"
                                referrerPolicy="no-referrer"
                              />
                              <div
                                onClick={() => {
                                  setActiveLightboxImage({
                                    imageUrl: msg.mediaUrl!,
                                    altText: `صورة من ${msg.senderName}`,
                                    senderName: msg.senderName,
                                    timestamp: msg.timestamp
                                  });
                                }}
                                className="absolute bottom-2 left-2 bg-black/60 hover:bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer pointer-events-auto"
                              >
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                <span>تكبير الصورة</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Voice Message */}
                      {msg.type === 'voice' && msg.mediaUrl && (
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 my-1 max-w-xs shadow-2xs dir-rtl">
                          <button
                            onClick={() => handleToggleVoice(msg.id, msg.mediaUrl)}
                            className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                          >
                            {playingVoiceId === msg.id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 translate-x-0.5" />
                            )}
                          </button>

                          <div className="flex-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                              <span className="flex items-center gap-1 font-bold">
                                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                                <span>رسالة صوتية</span>
                              </span>
                              <span>{msg.voiceDuration || 3}ث</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-amber-500 transition-all duration-300 ${
                                  playingVoiceId === msg.id ? 'w-full animate-pulse' : 'w-0'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Reactions Pill Display */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5 justify-start">
                          {Object.entries(msg.reactions).map(([emoji, rawUserIds]) => {
                            const userIds = (rawUserIds as string[]) || [];
                            if (userIds.length === 0) return null;
                            const hasMyReaction = currentUser ? userIds.includes(currentUser.id) : false;
                            const stickerUrl = EMOJI_STICKER_MAP[emoji];
                            return (
                              <button
                                key={emoji}
                                onClick={() => reactToMessage(msg.id, emoji)}
                                className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border transition-all cursor-pointer select-none active:scale-95 ${
                                  hasMyReaction
                                    ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold shadow-2xs'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                                }`}
                                title={`${userIds.length} تفاعل`}
                              >
                                {stickerUrl && stickerUrl.trim() !== '' ? (
                                  <img src={stickerUrl} alt={emoji} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                                ) : (
                                  <span>{emoji}</span>
                                )}
                                <span className="text-[11px] font-bold">{userIds.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Left Side (RTL End): Three dots (•••) and Timestamp matching screenshot */}
                <div className="flex items-center gap-2 text-slate-400 shrink-0 self-start pt-1 dir-ltr select-none">
                  {/* 3 Dots Menu Button */}
                  {currentUser && (
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id)}
                        className="text-slate-300 hover:text-slate-600 transition-colors cursor-pointer font-bold px-1 text-sm tracking-tighter"
                        title="خيارات الرسالة"
                      >
                        •••
                      </button>

                      {activeMenuMsgId === msg.id && (
                        <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 dir-rtl text-xs animate-in fade-in duration-100">
                          {!isMe && !isModOrHigher && (
                            <button
                              onClick={() => {
                                setActiveMenuMsgId(null);
                                setReportingMsg(msg);
                              }}
                              className="w-full text-right px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-1.5 cursor-pointer font-bold"
                            >
                              <Flag className="w-3.5 h-3.5 text-red-500" />
                              <span>إبلاغ عن المحتوى المسيء 🚩</span>
                            </button>
                          )}

                          {isModOrHigher && (
                            <button
                              onClick={() => {
                                setActiveMenuMsgId(null);
                                if (confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
                                  deleteMessage(msg.id);
                                }
                              }}
                              className="w-full text-right px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-1.5 cursor-pointer font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              <span>حذف</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Date / Timestamp formatted as HH:mm DD/MM */}
                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium font-sans">
                    {toEnglishDigits(msg.timestamp)} {toEnglishDigits(msg.date ? msg.date.substring(0, 5) : '22/08')}
                  </span>
                </div>
              </div>
              {isAnchoredHere && renderTopicBanner()}
            </React.Fragment>
          );
          })
        )}
      </div>

      {/* Live Typing Indicator */}
      {(() => {
        const activeRoomTypers = (Object.entries(typingUsers || {}) as [string, { username: string; roomId: string; isTyping: boolean }][])
          .filter(([userId, data]) => data.isTyping && data.roomId === currentRoom.id && userId !== currentUser?.id)
          .map(([_, data]) => data);

        if (activeRoomTypers.length === 0) return null;

        return (
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/90 px-3.5 py-1.5 rounded-full w-fit animate-pulse my-2 mx-3 shadow-2xs">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
            <span>✍️ {activeRoomTypers.map(t => t.username).join('، ')} يكتب الآن...</span>
          </div>
        );
      })()}

      {/* Floating Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollBottomBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={scrollToBottom}
            className="fixed bottom-24 left-6 z-20 bg-slate-900/90 hover:bg-slate-900 text-white px-3.5 py-2 rounded-full shadow-lg border border-slate-700 flex items-center gap-1.5 text-xs font-bold backdrop-blur-xs cursor-pointer active:scale-95 transition-all dir-rtl"
            title="الانتقال إلى أحدث الرسائل"
          >
            <ChevronDown className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="text-[11px]">آخر الرسائل</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Report Message Modal */}
      {reportingMsg && (
        <ReportMessageModal
          message={reportingMsg}
          onClose={() => setReportingMsg(null)}
        />
      )}

      {/* Image Lightbox Modal for Fullscreen Quality View */}
      {activeLightboxImage && (
        <ImageLightboxModal
          imageUrl={activeLightboxImage.imageUrl}
          altText={activeLightboxImage.altText}
          senderName={activeLightboxImage.senderName}
          timestamp={activeLightboxImage.timestamp}
          onClose={() => setActiveLightboxImage(null)}
        />
      )}
    </div>
  );
};

