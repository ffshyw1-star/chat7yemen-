import React, { useState, useMemo } from 'react';
import { X, Search, Youtube, Play, Check, Send, Sparkles } from 'lucide-react';
import { getYouTubeVideoId } from '../utils/permissions';

export interface YouTubeSongItem {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  duration: string;
  views?: string;
  thumbnail: string;
}

export const FEATURED_YOUTUBE_VIDEOS: YouTubeSongItem[] = [
  {
    id: 'yt-1',
    youtubeId: 'wD2l3r9O1zA',
    title: 'وكلت أمري | سالم المسعودي | Al Masoudi',
    channel: 'سالم المسعودي',
    duration: '4:15',
    views: '5 million',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop'
  },
  {
    id: 'yt-2',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'شيلة حماسية طرب 2026 - العز والعزوة والكرم',
    channel: 'شيلات الخليج واليمن',
    duration: '3:45',
    views: '2.8 million',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop'
  },
  {
    id: 'yt-3',
    youtubeId: 'R8l9b0A1h5k',
    title: 'يا مسافر على الجوف - طرب يمني صنعاني أصيل',
    channel: 'تراث الفن اليمني',
    duration: '5:12',
    views: '1.4 million',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop'
  },
  {
    id: 'yt-4',
    youtubeId: 'L_LUpnjgPso',
    title: 'فيروز - نسم علينا الهوا من مفرق الوادي',
    channel: 'فيروزيات الصباح',
    duration: '4:10',
    views: '8.2 million',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop'
  },
  {
    id: 'yt-5',
    youtubeId: 'fJ9rUzIMcDQ',
    title: 'أغنية هادئة ورايقة - نسيم الليل والهدوء والاسترخاء',
    channel: 'موسيقى روقان',
    duration: '6:30',
    views: '950K',
    thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop'
  },
  {
    id: 'yt-6',
    youtubeId: '3JZ_D3ELwOQ',
    title: 'جلسة عود يمنية ساحرة - روائع النغم والألحان',
    channel: 'جلسات طرب',
    duration: '7:40',
    views: '3.1 million',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop'
  }
];

interface YouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (youtubeId: string, title: string) => void;
}

export const YouTubeModal: React.FC<YouTubeModalProps> = ({
  isOpen,
  onClose,
  onSelectVideo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FEATURED_YOUTUBE_VIDEOS;

    const matched = FEATURED_YOUTUBE_VIDEOS.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.channel.toLowerCase().includes(q)
    );

    const directYtId = getYouTubeVideoId(searchQuery);
    if (directYtId && !matched.some((m) => m.youtubeId === directYtId)) {
      matched.unshift({
        id: `yt-direct-${Date.now()}`,
        youtubeId: directYtId,
        title: `مقطع يوتيوب مباشر: ${directYtId}`,
        channel: 'رابط مباشر',
        duration: 'مباشر',
        views: 'يوتيوب',
        thumbnail: `https://img.youtube.com/vi/${directYtId}/hqdefault.jpg`,
      });
    } else if (matched.length === 0 && q.length >= 2) {
      // Dynamic simulated search result
      matched.push({
        id: `yt-search-${Date.now()}`,
        youtubeId: 'wD2l3r9O1zA',
        title: `بحث يوتيوب: ${searchQuery}`,
        channel: 'YouTube Music & Videos',
        duration: '3:45',
        views: 'جديد',
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop',
      });
    }

    return matched;
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSend = (ytId: string, title: string) => {
    onSelectVideo(ytId, title);
    onClose();
    setSearchQuery('');
    setPreviewVideoId(null);
  };

  return (
    <div
      id="youtube-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="youtube-modal"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header matching Screenshot 4: Close (X) on left, YouTube logo on right in RTL */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          {/* Close X Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* YouTube Branding */}
          <div className="flex items-center gap-1.5 font-bold text-base text-slate-800">
            <span className="text-slate-900 tracking-tight font-black">YouTube</span>
            <div className="bg-[#ff0000] text-white rounded-md px-1.5 py-0.5 text-xs font-black flex items-center shadow-xs">
              <Youtube className="w-4 h-4 text-white fill-white" />
            </div>
          </div>
        </div>

        {/* Search Bar Input matching Screenshot 4 */}
        <div className="p-4 bg-white border-b border-slate-100">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في يوتيوب أو لصق الرابط هنا..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 rounded-xl py-2.5 pr-4 pl-10 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-all shadow-inner"
              autoFocus
            />
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Live Video Preview if activated */}
        {previewVideoId && (
          <div className="p-4 bg-slate-950 border-b border-slate-800">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-lg bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${previewVideoId}?autoplay=1`}
                title="معاينة فيديو يوتيوب"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-white">
              <span className="text-slate-300 font-bold">معاينة المقطع قبل الإرسال</span>
              <button
                type="button"
                onClick={() => setPreviewVideoId(null)}
                className="text-red-400 hover:text-red-300 underline font-bold cursor-pointer"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        )}

        {/* Video Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-bold">
            <span>اختر مقطعاً لإرساله إلى شات الغرفة مباشرة:</span>
            <span>{filteredVideos.length} فيديو</span>
          </div>

          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="bg-slate-50 hover:bg-red-50/50 border border-slate-200/90 hover:border-red-300 rounded-2xl p-2.5 flex items-center gap-3 transition-all group shadow-xs"
            >
              {/* Video Thumbnail with YouTube Red Play Button overlay */}
              <div
                onClick={() => setPreviewVideoId(video.youtubeId)}
                className="relative w-24 sm:w-28 aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0 cursor-pointer shadow-sm group-hover:scale-102 transition-transform"
                title="اضغط لمعاينة المقطع"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                  <div className="w-8 h-6 bg-[#ff0000] text-white rounded-md flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
                  </div>
                </div>
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 py-0.2 rounded font-mono font-bold">
                  {video.duration}
                </span>
              </div>

              {/* Title & Channel */}
              <div className="flex-1 min-w-0">
                <h4
                  onClick={() => handleSend(video.youtubeId, video.title)}
                  className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-red-700 cursor-pointer hover:underline"
                  title={video.title}
                >
                  {video.title}
                </h4>
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                  <span className="font-semibold text-slate-600">{video.channel}</span>
                  {video.views && (
                    <>
                      <span>•</span>
                      <span className="text-slate-400">{video.views}</span>
                    </>
                  )}
                </p>
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSend(video.youtubeId, video.title)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                title="إرسال المقطع فوراً للغرفة"
              >
                <Send className="w-3.5 h-3.5 rotate-180" />
                <span className="hidden sm:inline">إرسال</span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>يمكنك نسخ ولصق أي رابط من تطبيق YouTube وسيتعرف عليه فوراً</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-xs cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
