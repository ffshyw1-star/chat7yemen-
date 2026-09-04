import React, { useState, useEffect, useRef } from 'react';
import {
  X, HardDrive, Upload, FolderPlus, RefreshCw, LogIn, ExternalLink,
  Loader2, Trash2, Folder, FileText, Image as ImageIcon, Video, Music,
  File, Search, ArrowRight, Download, Send, Cloud, CheckCircle2,
  AlertTriangle, Shield, Archive, Grid, List
} from 'lucide-react';
import {
  signInWithGoogle,
  getCachedAccessToken,
  logoutGoogle,
  auth
} from '../lib/firebase';
import {
  fetchGoogleDriveFiles,
  fetchGoogleDriveQuota,
  createGoogleDriveFolder,
  uploadFileToGoogleDrive,
  uploadTextToGoogleDrive,
  deleteGoogleDriveFile,
  getOrCreateChatBackupsFolder,
  formatBytes,
  GoogleDriveFile,
  GoogleDriveQuota
} from '../lib/googleDrive';
import { useChat } from '../context/ChatContext';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, currentRoomId, messages, rooms, showTopBanner, sendMessage } = useChat();

  const [token, setToken] = useState<string | null>(getCachedAccessToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // File explorer states
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [quota, setQuota] = useState<GoogleDriveQuota | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'images' | 'videos' | 'audio' | 'documents' | 'folders'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Breadcrumbs navigation
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: 'ملفاتي' }
  ]);

  const currentFolderId = folderPath[folderPath.length - 1]?.id || 'root';

  // Creation & Upload state
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Delete Confirmation Modal state (Mandatory for destructive workspace operations)
  const [fileToDelete, setFileToDelete] = useState<GoogleDriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
        const cached = getCachedAccessToken();
        if (cached) {
          setToken(cached);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen && token) {
      loadFilesAndQuota();
    }
  }, [isOpen, token, currentFolderId, activeCategory]);

  const loadFilesAndQuota = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [fetchedFiles, fetchedQuota] = await Promise.all([
        fetchGoogleDriveFiles(token, currentFolderId, searchQuery, activeCategory),
        fetchGoogleDriveQuota(token)
      ]);
      setFiles(fetchedFiles);
      if (fetchedQuota) setQuota(fetchedQuota);
    } catch (err: any) {
      setError(err?.message || 'فشل جلب ملفات Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFilesAndQuota();
  };

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

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newFolderName.trim()) return;

    try {
      setLoading(true);
      await createGoogleDriveFolder(token, newFolderName.trim(), currentFolderId);
      setNewFolderName('');
      setIsCreatingFolder(false);
      setSuccessMsg('تم إنشاء المجلد بنجاح في Google Drive 📁');
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadFilesAndQuota();
    } catch (err: any) {
      setError(err?.message || 'تعذر إنشاء المجلد');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploading(true);
    setUploadProgress(10);
    setError(null);

    try {
      await uploadFileToGoogleDrive(token, file, currentFolderId, (p) => setUploadProgress(p));
      setSuccessMsg(`تم رفع "${file.name}" إلى Google Drive بنجاح ☁️`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadFilesAndQuota();
    } catch (err: any) {
      setError(err?.message || 'تعذر رفع الملف إلى Google Drive');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Backup Chat to Google Drive
  const handleBackupChatToDrive = async () => {
    if (!token) return;
    setIsBackingUp(true);
    setError(null);
    try {
      const currentRoom = rooms.find(r => r.id === currentRoomId);
      const roomName = currentRoom ? currentRoom.name : 'الدردشة العامة';
      const backupFolderId = await getOrCreateChatBackupsFolder(token);

      const backupData = {
        exportDate: new Date().toISOString(),
        room: { id: currentRoomId, name: roomName },
        totalMessages: messages.length,
        messages: messages.map(m => ({
          id: m.id,
          username: m.username,
          content: m.content,
          imageUrl: m.imageUrl,
          timestamp: m.timestamp,
          role: m.role
        }))
      };

      const filename = `نسخة_دردشة_${roomName.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('en-CA')}.json`;
      await uploadTextToGoogleDrive(
        token,
        filename,
        JSON.stringify(backupData, null, 2),
        'application/json',
        backupFolderId
      );

      setSuccessMsg(`تم حفظ النسخة الاحتياطية في Google Drive مجلد "نسخ الدردشة الاحتياطية" ✅`);
      showTopBanner?.('تم حفظ نسخة الدردشة بنجاح في Google Drive ☁️', 'success');
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadFilesAndQuota();
    } catch (err: any) {
      setError(err?.message || 'تعذر أخذ نسخة احتياطية إلى Google Drive');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Confirm and Execute Delete (Required Confirmation Dialog)
  const confirmDeleteFile = async () => {
    if (!token || !fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteGoogleDriveFile(token, fileToDelete.id);
      setSuccessMsg(`تم حذف "${fileToDelete.name}" من Google Drive بنجاح 🗑️`);
      setFileToDelete(null);
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadFilesAndQuota();
    } catch (err: any) {
      setError(err?.message || 'تعذر حذف الملف');
    } finally {
      setIsDeleting(false);
    }
  };

  // Share File Link directly into Chat
  const handleShareToChat = (file: GoogleDriveFile) => {
    const link = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;
    const shareText = `📁 **مشاركة من Google Drive:**\n[${file.name}](${link})`;
    sendMessage(shareText);
    showTopBanner?.(`تمت مشاركة رابط "${file.name}" في الدردشة 💬`, 'success');
    onClose();
  };

  // Folder navigation helpers
  const openFolder = (folder: GoogleDriveFile) => {
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
    setSearchQuery('');
  };

  const navigateToBreadcrumb = (index: number) => {
    setFolderPath(prev => prev.slice(0, index + 1));
    setSearchQuery('');
  };

  // Helper to render appropriate file icons
  const getFileIcon = (file: GoogleDriveFile) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="w-7 h-7 text-amber-400 fill-amber-400/20" />;
    }
    if (file.mimeType.startsWith('image/')) {
      return <ImageIcon className="w-7 h-7 text-emerald-400" />;
    }
    if (file.mimeType.startsWith('video/')) {
      return <Video className="w-7 h-7 text-rose-400" />;
    }
    if (file.mimeType.startsWith('audio/')) {
      return <Music className="w-7 h-7 text-purple-400" />;
    }
    if (file.mimeType.includes('pdf') || file.mimeType.includes('document') || file.mimeType.includes('text/')) {
      return <FileText className="w-7 h-7 text-blue-400" />;
    }
    if (file.mimeType.includes('zip') || file.mimeType.includes('rar') || file.mimeType.includes('tar')) {
      return <Archive className="w-7 h-7 text-orange-400" />;
    }
    return <File className="w-7 h-7 text-slate-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in dir-rtl">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Google Drive - ملفاتي السحابية
                </h2>
                <span className="text-[11px] bg-blue-950/90 text-blue-300 border border-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                  متصل بـ Drive
                </span>
              </div>
              <p className="text-xs text-slate-400">
                استعراض، رفع، مشاركة ملفاتك وأخذ نسخ احتياطية للدردشة على Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {!token ? (
          /* Sign-In Request Screen */
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-5 shadow-inner">
              <HardDrive className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">
              ربط حساب Google Drive
            </h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              قم بتسجيل الدخول بحساب Google المعتمد للوصول إلى ملفاتك، رفع الصور والمستندات، وحفظ النسخ الاحتياطية للدردشة بأمان تام.
            </p>
            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs w-full text-right">
                {error}
              </div>
            )}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  تسجيل الدخول وربط Google Drive
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-900/50">
            
            {/* Top Action Bar & Quota */}
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold text-slate-300 py-1">
                {folderPath.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    {idx > 0 && <span className="text-slate-600">/</span>}
                    <button
                      onClick={() => navigateToBreadcrumb(idx)}
                      className={`hover:text-blue-400 transition-colors px-1.5 py-0.5 rounded ${
                        idx === folderPath.length - 1 ? 'text-white font-bold bg-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {item.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Upload File Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  رفع ملف
                </button>

                {/* Create Folder Button */}
                <button
                  onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                  className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                  مجلد جديد
                </button>

                {/* Backup Chat Button */}
                <button
                  onClick={handleBackupChatToDrive}
                  disabled={isBackingUp}
                  className="py-1.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="أخذ نسخة احتياطية من رسائل الغرفة الحالية وحفظها في Google Drive"
                >
                  {isBackingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                  نسخ احتياطي للدردشة
                </button>

                {/* Refresh */}
                <button
                  onClick={loadFilesAndQuota}
                  disabled={loading}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  title="تحديث الملفات"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                {/* View Mode Toggle */}
                <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                    title="عرض شبكي"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                    title="عرض كقائمة"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Create Folder Inline Form */}
            {isCreatingFolder && (
              <form
                onSubmit={handleCreateFolder}
                className="px-4 py-2.5 bg-blue-950/30 border-b border-blue-800/40 flex items-center gap-2 animate-fade-in"
              >
                <FolderPlus className="w-4 h-4 text-amber-400 shrink-0" />
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="اسم المجلد الجديد..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newFolderName.trim() || loading}
                  className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  إنشاء
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  إلغاء
                </button>
              </form>
            )}

            {/* Search & Filter Bar */}
            <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-950/20">
              <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث في Google Drive..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-1.5 pr-9 pl-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </form>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'folders', label: 'مجلدات' },
                  { id: 'images', label: 'صور' },
                  { id: 'videos', label: 'فيديو' },
                  { id: 'audio', label: 'صوت' },
                  { id: 'documents', label: 'مستندات' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`py-1 px-2.5 rounded-lg font-bold transition-colors ${
                      activeCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Alerts */}
            {successMsg && (
              <div className="mx-4 mt-2 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {error && (
              <div className="mx-4 mt-2 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* File List / Grid Container */}
            <div className="flex-1 p-4 overflow-y-auto min-h-[300px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                  <p className="text-xs font-semibold">جارٍ تحميل ملفات Google Drive...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
                  <HardDrive className="w-12 h-12 stroke-1 mb-2 text-slate-600" />
                  <p className="text-sm font-bold text-slate-400">لا توجد ملفات في هذا المجلد</p>
                  <p className="text-xs text-slate-500 mt-1">
                    يمكنك رفع ملف جديد أو إنشاء مجلد باستخدام الأزرار بالأعلى
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {files.map((file) => {
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    return (
                      <div
                        key={file.id}
                        onDoubleClick={() => (isFolder ? openFolder(file) : null)}
                        className="group bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 rounded-xl p-3 flex flex-col justify-between transition-all duration-150 relative overflow-hidden text-right"
                      >
                        {/* File Thumbnail or Icon */}
                        <div
                          onClick={() => (isFolder ? openFolder(file) : null)}
                          className={`w-full h-24 rounded-lg flex items-center justify-center mb-2 bg-slate-900/60 overflow-hidden ${
                            isFolder ? 'cursor-pointer' : ''
                          }`}
                        >
                          {file.thumbnailLink ? (
                            <img
                              src={file.thumbnailLink}
                              alt={file.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getFileIcon(file)
                          )}
                        </div>

                        {/* File Info */}
                        <div className="mb-2 min-w-0">
                          <p
                            className="text-xs font-bold text-slate-200 truncate group-hover:text-blue-300"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {isFolder ? 'مجلد' : formatBytes(file.size)}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                          {!isFolder ? (
                            <>
                              <button
                                onClick={() => handleShareToChat(file)}
                                className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white transition-colors"
                                title="مشاركة في الدردشة"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="فتح ومعاينة في Drive"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </>
                          ) : (
                            <button
                              onClick={() => openFolder(file)}
                              className="w-full py-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 text-center"
                            >
                              فتح المجلد
                            </button>
                          )}
                          <button
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                            title="حذف من Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="divide-y divide-slate-800/80 bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden">
                  {files.map((file) => {
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    return (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 hover:bg-slate-800/60 transition-colors text-right"
                      >
                        <div
                          onClick={() => (isFolder ? openFolder(file) : null)}
                          className={`flex items-center gap-3 min-w-0 flex-1 ${isFolder ? 'cursor-pointer' : ''}`}
                        >
                          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                            {getFileIcon(file)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {isFolder ? 'مجلد ملفات' : `${formatBytes(file.size)} • ${file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('ar-YE') : ''}`}
                            </p>
                          </div>
                        </div>

                        {/* List Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 mr-2">
                          {!isFolder && (
                            <>
                              <button
                                onClick={() => handleShareToChat(file)}
                                className="py-1 px-2.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                              >
                                <Send className="w-3 h-3" />
                                <span className="hidden sm:inline">مشاركة بالشات</span>
                              </button>
                              <a
                                href={file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="فتح ومعاينة"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </>
                          )}
                          <button
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Status Footer (Storage Quota & Logout) */}
            <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-400" />
                {quota?.usage ? (
                  <span>
                    المساحة المستخدمة:{' '}
                    <strong className="text-white">{formatBytes(quota.usage)}</strong>
                    {quota.limit ? ` من ${formatBytes(quota.limit)}` : ''}
                  </span>
                ) : (
                  <span>Google Drive متصل</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={logoutGoogle}
                  className="text-xs text-rose-400 hover:underline transition-colors"
                >
                  تسجيل الخروج من Google
                </button>
              </div>
            </div>

          </div>
        )}

        {/* User Confirmation Dialog for Destructive File Deletions (Mandatory) */}
        {fileToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in dir-rtl">
            <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-5 max-w-sm w-full shadow-2xl text-right">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                تأكيد حذف الملف من Google Drive
              </h4>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف <strong className="text-white">"{fileToDelete.name}"</strong> نهائياً من مساحة التخزين في Google Drive؟
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setFileToDelete(null)}
                  disabled={isDeleting}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDeleteFile}
                  disabled={isDeleting}
                  className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  تأكيد الحذف
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
