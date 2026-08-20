import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  MessageSquare, Trash2, Search, Download, Filter, AlertCircle,
  Clock, Shield, RefreshCw, CheckCircle2
} from 'lucide-react';

export const MessagesView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const { messages, setMessages, privateMessages, setPrivateMessages } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('all');

  const filteredMessages = messages.filter(m => {
    const matchesSearch = !searchTerm || m.text?.toLowerCase().includes(searchTerm.toLowerCase()) || m.senderName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRoom = selectedRoomFilter === 'all' || m.roomId === selectedRoomFilter;
    return matchesSearch && matchesRoom;
  });

  const handleClearPublicChat = () => {
    if (window.confirm('هل أنت متأكد من مسح جميع رسائل الدردشة العامة لكافة الغرف؟ لا يمكن التراجع.')) {
      setMessages([]);
      showToast('تم مسح جميع رسائل الدردشة العامة بنجاح 🧹');
    }
  };

  const handleClearPrivateChats = () => {
    if (window.confirm('هل أنت متأكد من مسح أرشيف المحادثات الخاصة بالكامل؟')) {
      setPrivateMessages({});
      showToast('تم تفريغ أرشيف المحادثات الخاصة 🧹');
    }
  };

  const handleExportPublicChat = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `chat_archive_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('تم تصدير سجلات الدردشة بنجاح 📥');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header & Quick Action Buttons */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>إدارة الرسائل والمحادثات العامة والخاصة</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            البحث في الرسائل، تفريغ الأرشيف، وتصدير السجلات بصيغة JSON
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportPublicChat}
            className="flex-1 sm:flex-none px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير السجلات</span>
          </button>
          <button
            onClick={handleClearPublicChat}
            className="flex-1 sm:flex-none px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح العام 🧹</span>
          </button>
          <button
            onClick={handleClearPrivateChats}
            className="flex-1 sm:flex-none px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح الخاص 🧹</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث في نصوص الرسائل أو أسماء المرسلين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-xs font-bold"
          />
        </div>
      </div>

      {/* Messages List Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-black text-slate-700">
          <span>الرسائل المسجلة ({filteredMessages.length})</span>
          <span className="text-[11px] text-slate-500 font-normal">عرض أحدث الرسائل المباشرة</span>
        </div>

        <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
          {filteredMessages.length > 0 ? (
            filteredMessages.slice(-50).reverse().map((msg, idx) => (
              <div key={msg.id || idx} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0 text-xs">
                    {msg.senderName?.charAt(0) || '👤'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp || 'الآن'}</span>
                    </div>
                    <p className="text-slate-700 mt-0.5 break-words font-medium">{msg.text}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMessages(prev => prev.filter(m => m.id !== msg.id));
                    showToast('تم حذف الرسالة بنجاح 🗑️');
                  }}
                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
                  title="حذف الرسالة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 font-bold">
              لا توجد رسائل مطابقة لخيارات البحث
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
