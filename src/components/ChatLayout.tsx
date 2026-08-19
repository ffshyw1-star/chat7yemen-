import React from 'react';
import { useChat } from '../context/ChatContext';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { BottomNav } from './BottomNav';
import { OnlineList } from './OnlineList';
import { RoomsListPanel } from './RoomsListPanel';
import { UserCardModal } from './UserCardModal';
import { UserProfileModal } from './UserProfileModal';
import { AccountSettingsModal } from './AccountSettingsModal';
import { StoreModal } from './StoreModal';
import { SideMenuModal } from './SideMenuModal';
import { PrivateChatModal } from './PrivateChatModal';
import { ReportsModal } from './ReportsModal';
import { NotificationsModal } from './NotificationsModal';
import { FriendRequestsModal } from './FriendRequestsModal';
import { RoomLogsModal } from './RoomLogsModal';
import { RoomSettingsModal } from './RoomSettingsModal';
import { KickedOverlayModal } from './KickedOverlayModal';
import { OwnerDashboardModal } from './OwnerDashboardModal';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { RoomPasswordModal } from './RoomPasswordModal';

export const ChatLayout: React.FC = () => {
  const {
    themeMode,
    isOnlineListOpen, setIsOnlineListOpen, isRoomsListOpen, setIsRoomsListOpen, selectedUserForCard, selectedUserForProfile,
    isProfileSettingsOpen, isOwnerDashboardOpen, isStoreOpen, isSideMenuOpen, isPrivateChatOpen,
    isReportsOpen, isNotificationsOpen, isFriendRequestsOpen,
    isRoomLogsOpen, isRoomSettingsOpen
  } = useChat();

  return (
    <div className={`h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none theme-${themeMode}`}>
      {/* 1. Top Header Toolbar */}
      <ChatHeader />

      {/* 2. Middle Chat Area with Side Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Central Chat Messages Box */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          <ChatMessages />
          <ChatInput />
        </div>

        {/* Right-Aligned Drawer Panel for Online Users & Rooms (Identical Width & Height) */}
        {(isOnlineListOpen || isRoomsListOpen) && (
          <div className="absolute inset-0 z-30 flex">
            {/* Right Drawer Panel placed on the RIGHT side of the screen */}
            <div className="w-[84%] sm:w-[380px] md:w-[420px] max-w-[450px] h-full bg-white shadow-2xl relative z-10 animate-in slide-in-from-right duration-200 flex flex-col shrink-0">
              {isOnlineListOpen && <OnlineList />}
              {isRoomsListOpen && <RoomsListPanel />}
            </div>

            {/* Backdrop overlay covering the remaining space on the LEFT */}
            <div
              className="flex-1 bg-black/40 backdrop-blur-xs cursor-pointer animate-in fade-in duration-200"
              onClick={() => {
                setIsOnlineListOpen(false);
                setIsRoomsListOpen(false);
              }}
              title="إغلاق القائمة"
            />
          </div>
        )}
      </div>

      {/* 3. Bottom Toolbar Bar */}
      <BottomNav />

      {/* 4. Popover Modals & Dialogs */}
      {selectedUserForCard && <UserCardModal />}
      {selectedUserForProfile && <UserProfileModal />}
      {isProfileSettingsOpen && <AccountSettingsModal />}
      {isStoreOpen && <StoreModal />}
      {isSideMenuOpen && <SideMenuModal />}
      {isPrivateChatOpen && <PrivateChatModal />}
      {isReportsOpen && <ReportsModal />}
      {isNotificationsOpen && <NotificationsModal />}
      {isFriendRequestsOpen && <FriendRequestsModal />}
      {isRoomLogsOpen && <RoomLogsModal />}
      {isRoomSettingsOpen && <RoomSettingsModal />}
      {isOwnerDashboardOpen && <OwnerDashboardModal />}
      <KickedOverlayModal />
      <LogoutConfirmModal />
      <RoomPasswordModal />
    </div>
  );
};
