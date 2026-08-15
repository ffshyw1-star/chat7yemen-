import React from 'react';
import { useChat } from '../context/ChatContext';
import { UserAvatar } from './UserAvatar';
import { X, Check } from 'lucide-react';

export const FriendRequestsModal: React.FC = () => {
  const { friendRequests, setIsFriendRequestsOpen, acceptFriendRequest, rejectFriendRequest, users, currentUser } = useChat();

  const myRequests = friendRequests.filter(fr => fr.receiverId === currentUser?.id);

  // Aesthetic color generator for friend request usernames matching screenshot
  const getRequestNameColor = (username: string) => {
    if (username.startsWith('Abd') || username.toLowerCase().includes('abdenour')) return 'text-[#e11d48]'; // Pinkish red
    if (username.startsWith('Śåłv') || username.toLowerCase().includes('salven')) return 'text-[#9f1239]'; // Dark maroon
    if (username.startsWith('cocky')) return 'text-[#475569]'; // Slate gray
    if (username.startsWith('Exterminator')) return 'text-[#ea580c]'; // Orange
    if (username.startsWith('Hajoura')) return 'text-[#64748b]'; // Slate
    if (username.startsWith('Haytheeeeem')) return 'text-[#334155]'; // Dark Slate
    return 'text-[#1e293b]';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 dir-rtl font-sans select-none">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]">
        
        {/* Dark Top Header Bar (#0B252E matching Screenshot) */}
        <div className="bg-[#0B252E] px-4 py-3 flex items-center justify-start shrink-0 border-b border-[#081d24]">
          <button
            onClick={() => setIsFriendRequestsOpen(false)}
            className="text-white hover:text-slate-300 transition-colors cursor-pointer p-0.5"
            title="إغلاق"
          >
            <X className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Requests List Container */}
        <div className="flex-1 overflow-y-auto bg-[#f5f7f9] p-3 sm:p-4 space-y-2.5 custom-scrollbar min-h-[300px]">
          {myRequests.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-bold text-sm">
              لا توجد طلبات صداقة قيد الانتظار حالياً
            </div>
          ) : (
            myRequests.map((req) => {
              const sender = users.find(u => u.id === req.senderId);
              const senderName = sender?.username || req.senderName || 'عضو';
              const nameColorClass = getRequestNameColor(senderName);

              return (
                <div
                  key={req.id}
                  className="bg-[#ebf0f4] hover:bg-[#e2e8f0] border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs transition-colors"
                >
                  {/* Left Side: Accept Checkmark (✔) & Reject Cross (✖) Buttons */}
                  <div className="flex items-center gap-4 shrink-0 pl-1">
                    {/* Accept (Green Checkmark) */}
                    <button
                      onClick={() => acceptFriendRequest(req.id)}
                      className="text-[#2e7d32] hover:text-[#1b5e20] hover:scale-115 transition-all cursor-pointer p-1"
                      title="قبول طلب الصداقة"
                    >
                      <Check className="w-7 h-7 stroke-[3.8]" />
                    </button>

                    {/* Reject (Red Cross) */}
                    <button
                      onClick={() => rejectFriendRequest(req.id)}
                      className="text-[#c62828] hover:text-[#b71c1c] hover:scale-115 transition-all cursor-pointer p-1"
                      title="رفض طلب الصداقة"
                    >
                      <X className="w-7 h-7 stroke-[3.8]" />
                    </button>
                  </div>

                  {/* Right Side: Username and Circular User Avatar */}
                  <div className="flex items-center gap-3 min-w-0 pr-1">
                    <span className={`font-extrabold text-base sm:text-lg truncate tracking-tight ${nameColorClass}`}>
                      {senderName}
                    </span>

                    <div className="shrink-0">
                      <UserAvatar
                        avatarUrl={sender?.avatar || req.senderAvatar || ''}
                        gender={sender?.gender || 'male'}
                        role={sender?.role || 'member'}
                        username={senderName}
                        size="md"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

