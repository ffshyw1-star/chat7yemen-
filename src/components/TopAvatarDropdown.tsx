import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';

export interface TopAvatarDropdownProps {
  className?: string;
}

export const TopAvatarDropdown: React.FC<TopAvatarDropdownProps> = ({ className = '' }) => {
  const {
    currentUser,
    currentRoom,
    setCurrentView,
    setIsRoomSettingsOpen,
    setIsOwnerDashboardOpen,
    setIsLogoutConfirmOpen,
    setSelectedUserForProfile,
    setIsSideMenuOpen,
    currentUserCan
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  if (!currentUser) return null;

  // Strict role & permission checks matching ArabSyemen architecture
  const canManageRoom = Boolean(
    currentUser && (
      ['moderator', 'management', 'admin', 'owner'].includes(currentUser.role) ||
      (currentRoom && currentRoom.createdBy === currentUser.id) ||
      currentUserCan('edit_room')
    )
  );

  const canAccessAdmin = Boolean(
    currentUser && (
      ['management', 'admin', 'owner'].includes(currentUser.role) ||
      currentUser.isPrimaryOwner
    )
  );

  // Avatar source resolution
  const defaultAvatar = currentUser.gender === 'female'
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
  const avatarSrc = currentUser.avatar || defaultAvatar;

  // Toggle handler
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(prev => {
      const nextState = !prev;
      if (nextState) {
        // Hide any other .sysmenu on the page
        document.querySelectorAll('.sysmenu').forEach(el => {
          if (el.id !== 'mobile_main_menu') {
            (el as HTMLElement).style.display = 'none';
            el.setAttribute('hidden', '');
          }
        });
      }
      return nextState;
    });
  };

  // Close helper
  const closeMenu = () => {
    setIsOpen(false);
  };

  // Action: ملفي الشخصي
  const handleEditProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    if (typeof (window as any).editProfile === 'function') {
      (window as any).editProfile();
    } else {
      setSelectedUserForProfile(currentUser);
    }
  };

  // Action: قائمة (Home/Rooms)
  const handleBackHome = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    setCurrentView('rooms');
    setIsSideMenuOpen(false);
  };

  // Action: إعدادات الغرفة
  const handleRoomSetting = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    setIsRoomSettingsOpen(true);
  };

  // Action: لوحة التحكم
  const handleOpenAdmin = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    setIsOwnerDashboardOpen(true);
  };

  // Action: خروج
  const handleOpenLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    setIsLogoutConfirmOpen(true);
  };

  // Click outside and Escape key handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeMenu();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Expose global ArabSyemen runtime functions
  useEffect(() => {
    (window as any).showMenu = (id: string) => {
      if (id === 'mobile_main_menu') {
        setIsOpen(prev => !prev);
      } else {
        setIsOpen(false);
        const target = document.getElementById(id);
        if (target) {
          const isVisible = target.style.display !== 'none' && !target.hasAttribute('hidden');
          target.style.display = isVisible ? 'none' : 'block';
          if (isVisible) target.setAttribute('hidden', '');
          else target.removeAttribute('hidden');
        }
      }
    };

    (window as any).hideMenu = (id?: string) => {
      if (!id || id === 'mobile_main_menu') {
        setIsOpen(false);
      }
      if (id) {
        const target = document.getElementById(id);
        if (target) {
          target.style.display = 'none';
          target.setAttribute('hidden', '');
        }
      }
    };

    (window as any).getRoomSetting = () => {
      setIsRoomSettingsOpen(true);
    };

    (window as any).openLogout = () => {
      setIsLogoutConfirmOpen(true);
    };

    (window as any).openLinkPage = (url: string) => {
      if (url === 'admin.php' || url.includes('admin')) {
        setIsOwnerDashboardOpen(true);
      } else {
        console.log('openLinkPage called for:', url);
      }
    };

    return () => {
      delete (window as any).showMenu;
      delete (window as any).hideMenu;
      delete (window as any).getRoomSetting;
      delete (window as any).openLogout;
      delete (window as any).openLinkPage;
    };
  }, [setIsRoomSettingsOpen, setIsLogoutConfirmOpen, setIsOwnerDashboardOpen]);

  return (
    <div
      ref={containerRef}
      className={`top-avatar-menu relative ${className}`}
      dir="rtl"
    >
      {/* مشغّل الصورة الشخصية (#main_mob_menu) */}
      <button
        ref={triggerRef}
        id="main_mob_menu"
        className="avatar-trigger menutrig"
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-controls="mobile_main_menu"
        aria-label="فتح قائمة الحساب"
        onClick={handleToggle}
        title="قائمة الحساب"
      >
        <img
          className="avatar_menu glob_av menutrig"
          src={avatarSrc}
          alt={currentUser.username}
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultAvatar;
          }}
          referrerPolicy="no-referrer"
        />
      </button>

      {/* القائمة المنسدلة (#mobile_main_menu) */}
      <div
        ref={menuRef}
        id="mobile_main_menu"
        className="sysmenu hideall fmenu"
        role="menu"
        hidden={!isOpen}
        style={{ display: isOpen ? 'block' : 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. ملفي الشخصي (fa fa-user-circle menuo) */}
        <button
          className="fmenu_item"
          type="button"
          role="menuitem"
          onClick={handleEditProfile}
        >
          <span className="fmenu_icon">
            <i className="fa fa-user-circle menuo" aria-hidden="true"></i>
          </span>
          <span className="fmenu_text">ملفي الشخصي</span>
        </button>

        {/* 2. قائمة (#back_home, fa fa-home menuo) */}
        <button
          id="back_home"
          className="fmenu_item"
          type="button"
          role="menuitem"
          onClick={handleBackHome}
        >
          <span className="fmenu_icon">
            <i className="fa fa-home menuo" aria-hidden="true"></i>
          </span>
          <span className="fmenu_text">قائمة</span>
        </button>

        {/* 3. إعدادات الغرفة (#room_setting_menu, fa fa-cog menuo) - يظهر وفق الصلاحيات */}
        {canManageRoom && (
          <button
            id="room_setting_menu"
            className="fmenu_item"
            type="button"
            role="menuitem"
            onClick={handleRoomSetting}
          >
            <span className="fmenu_icon">
              <i className="fa fa-cog menuo" aria-hidden="true"></i>
            </span>
            <span className="fmenu_text">إعدادات الغرفة</span>
          </button>
        )}

        {/* 4. لوحة التحكم (fa fa-dashboard menuo) - يظهر للإدارة والمالك */}
        {canAccessAdmin && (
          <button
            className="fmenu_item"
            type="button"
            role="menuitem"
            onClick={handleOpenAdmin}
          >
            <span className="fmenu_icon">
              <i className="fa fa-dashboard menuo" aria-hidden="true"></i>
            </span>
            <span className="fmenu_text">لوحة التحكم</span>
          </button>
        )}

        {/* 5. خروج (#open_logout, fa fa-sign-out menuo) */}
        <button
          id="open_logout"
          className="fmenu_item"
          type="button"
          role="menuitem"
          onClick={handleOpenLogout}
        >
          <span className="fmenu_icon">
            <i className="fa fa-sign-out menuo" aria-hidden="true"></i>
          </span>
          <span className="fmenu_text">خروج</span>
        </button>
      </div>
    </div>
  );
};

export default TopAvatarDropdown;
