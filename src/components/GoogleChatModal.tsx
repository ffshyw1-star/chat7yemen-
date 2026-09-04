import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send, RefreshCw, LogIn, ExternalLink, Loader2, CheckCircle2, Shield } from 'lucide-react';
import {
  signInWithGoogle,
  getCachedAccessToken,
  logoutGoogle,
  auth
} from '../lib/firebase';
import {
  fetchGoogleChatSpaces,
  fetchGoogleChatMessages,
  sendGoogleChatMessage,
  GoogleChatSpace,
  GoogleChatMessage
} from '../lib/googleChat';

interface GoogleChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleChatModal: React.FC<GoogleChatModalProps> = ({ isOpen, onClose }) => {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [token, setToken] = useState<string | null>(getCachedAccessToken());
  const [spaces, setSpaces] = useState<GoogleChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<GoogleChatSpace | null>(null);
  const [messages, setMessages] = useState<GoogleChatMessage[]>([]);
  const [newMsgText, setNewMsgText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen && token) {
      loadSpaces();
    }
  }, [isOpen, token]);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res?.idToken) {
        setToken(res.idToken);
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      setError(err?.message || 'فشل تسجيل الدخول باستخدام حساب Google');
    } finally {
      setLoading(false);
    }
  };

  const loadSpaces = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGoogleChatSpaces(token);
      setSpaces(data);
      if (data.length > 0 && !selectedSpace) {
        selectSpace(data[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'فشل جلب مساحات Google Chat');
    } finally {
      setLoading(false);
    }
  };

  const selectSpace = async (space: GoogleChatSpace) => {
    setSelectedSpace(space);
    if (!token) return;
    setLoadingMessages(true);
    try {
      const msgs = await fetchGoogleChatMessages(token, space.name);
      setMessages(msgs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedSpace || !newMsgText.trim() || sending) return;

    setSending(true);
    setError(null);
    try {
      const sent = await sendGoogleChatMessage(token, selectedSpace.name, newMsgText.trim());
      setMessages((prev) => [...prev, sent]);
      setNewMsgText('');
    } catch (err: any) {
      setError(err?.message || 'تعذر إرسال الرسالة إلى Google Chat');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in dir-rtl">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                محادثات Google Chat
                <span className="text-[11px] bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  متصل بالخدمة
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                إدارة ومزامنة غرف ومساحات Google Chat مباشرة من داخل التطبيق
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {!token ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              تسجيل الدخول باستخدام حساب Google
            </h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              يرجى تسجيل الدخول بحساب Google المعتمد لمنح صلاحيات قراءة وإرسال رسائل مساحات Google Chat بامان تام.
            </p>
            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs w-full text-right">
                {error}
              </div>
            )}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  تسجيل الدخول بـ Google
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row min-h-[450px] overflow-hidden">
            {/* Sidebar: Spaces List */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-l border-slate-800 bg-slate-950/40 flex flex-col">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-black text-slate-300">المساحات والغرف ({spaces.length})</span>
                <button
                  onClick={loadSpaces}
                  disabled={loading}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="تحديث القائمة"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[160px] md:max-h-none">
                {loading && spaces.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                    جارٍ التحميل...
                  </div>
                ) : spaces.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    لم يتم العثور على مساحات نشطة
                  </div>
                ) : (
                  spaces.map((space) => {
                    const isSelected = selectedSpace?.name === space.name;
                    return (
                      <button
                        key={space.name}
                        onClick={() => selectSpace(space)}
                        className={`w-full text-right p-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="truncate">
                          {space.displayName || 'محادثة خاصة'}
                        </span>
                        {space.type === 'SPACE' && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                            غرفة
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="p-2 border-t border-slate-800 text-center">
                <button
                  onClick={logoutGoogle}
                  className="text-xs text-rose-400 hover:underline"
                >
                  تسجيل الخروج من Google
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-900/60 overflow-hidden">
              {selectedSpace ? (
                <>
                  {/* Space Subheader */}
                  <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">
                        {selectedSpace.displayName || 'محادثة Google Chat'}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono truncate dir-ltr text-right">
                        {selectedSpace.name}
                      </p>
                    </div>
                  </div>

                  {/* Messages View */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full text-xs text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        جارٍ تحميل الرسائل...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-xs text-slate-500">
                        لا توجد رسائل سابقة في هذه المساحة
                      </div>
                    ) : (
                      messages.map((msg, index) => (
                        <div
                          key={msg.name || index}
                          className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl max-w-[85%]"
                        >
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <span className="text-xs font-bold text-emerald-400">
                              {msg.sender?.displayName || 'مستخدم'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {msg.createTime ? new Date(msg.createTime).toLocaleTimeString('ar-YE') : ''}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-200 break-words leading-relaxed">
                            {msg.text || msg.formattedText || ''}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input form */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={newMsgText}
                      onChange={(e) => setNewMsgText(e.target.value)}
                      placeholder="اكتب رسالة لإرسالها إلى مساحة Google Chat..."
                      disabled={sending}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMsgText.trim()}
                      className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-40"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                  اختر مساحة أو غرفة من القائمة الجانبية لعرض رسائلها
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
