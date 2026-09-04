import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useChat } from './ChatContext';
import { Room, UserRole, RoomStaffMember } from '../types';

export interface RoomIconOption {
  id: string;
  name: string;
  type: 'lucide' | 'emoji';
  value: string;
}

export const PRESET_ROOM_ICONS: RoomIconOption[] = [
  { id: 'globe', name: 'عام (كرة أرضية)', type: 'lucide', value: 'globe' },
  { id: 'diamond', name: 'غرفة ماسية', type: 'lucide', value: 'diamond' },
  { id: 'admin_star', name: 'غرفة إدارة', type: 'lucide', value: 'admin_star' },
  { id: 'crown', name: 'تاج الملك', type: 'lucide', value: 'crown' },
  { id: 'flame', name: 'شعلة / حماس', type: 'lucide', value: 'flame' },
  { id: 'heart', name: 'حب وخواطر', type: 'lucide', value: 'heart' },
  { id: 'music', name: 'طرب وموسيقى', type: 'lucide', value: 'music' },
  { id: 'game', name: 'ألعاب وتسلية', type: 'lucide', value: 'game' },
  { id: 'coffee', name: 'استراحة / قهوة', type: 'lucide', value: 'coffee' },
  { id: 'sparkles', name: 'تميز وإبداع', type: 'lucide', value: 'sparkles' },
  { id: 'trophy', name: 'تحديات ومسابقات', type: 'lucide', value: 'trophy' },
  { id: 'shield', name: 'أمان وهيبة', type: 'lucide', value: 'shield' },
  { id: 'message', name: 'سوالف ونقاشات', type: 'lucide', value: 'message' }
];

export interface RoomsContextType {
  rooms: Room[];
  currentRoom: Room;
  switchRoom: (roomId: string, passwordAttempt?: string) => boolean;
  addRoom: (roomInput: Partial<Room> | string, flag?: string, description?: string) => void;
  deleteRoom: (roomId: string) => void;
  updateRoomDetails: (roomId: string, updates: Partial<Room>) => void;
  updateRoomIcon: (roomId: string, iconOrUrl: string, isImageUrl?: boolean) => void;
  assignRoomStaff: (roomId: string, userId: string, role: any) => void;
  removeRoomStaff: (roomId: string, userId: string) => void;
  presetIcons: RoomIconOption[];
}

const RoomsContext = createContext<RoomsContextType | null>(null);

export const RoomsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    rooms,
    currentRoom,
    switchRoom,
    addRoom,
    deleteRoom,
    updateRoomDetails,
    assignRoomStaff,
    removeRoomStaff
  } = useChat();

  const updateRoomIcon = useCallback((roomId: string, iconOrUrl: string, isImageUrl: boolean = false) => {
    if (isImageUrl) {
      updateRoomDetails(roomId, {
        iconUrl: iconOrUrl,
        customIcon: 'custom_image'
      });
    } else {
      updateRoomDetails(roomId, {
        customIcon: iconOrUrl,
        iconUrl: undefined
      });
    }
  }, [updateRoomDetails]);

  const value = useMemo(() => ({
    rooms,
    currentRoom,
    switchRoom,
    addRoom,
    deleteRoom,
    updateRoomDetails,
    updateRoomIcon,
    assignRoomStaff,
    removeRoomStaff,
    presetIcons: PRESET_ROOM_ICONS
  }), [
    rooms,
    currentRoom,
    switchRoom,
    addRoom,
    deleteRoom,
    updateRoomDetails,
    updateRoomIcon,
    assignRoomStaff,
    removeRoomStaff
  ]);

  return (
    <RoomsContext.Provider value={value}>
      {children}
    </RoomsContext.Provider>
  );
};

export const useRooms = () => {
  const context = useContext(RoomsContext);
  if (!context) {
    // Graceful fallback to chat context directly
    const chat = useChat();
    return {
      rooms: chat.rooms,
      currentRoom: chat.currentRoom,
      switchRoom: chat.switchRoom,
      addRoom: chat.addRoom,
      deleteRoom: chat.deleteRoom,
      updateRoomDetails: chat.updateRoomDetails,
      updateRoomIcon: (roomId: string, iconOrUrl: string, isImageUrl: boolean = false) => {
        if (isImageUrl) {
          chat.updateRoomDetails(roomId, { iconUrl: iconOrUrl, customIcon: 'custom_image' } as any);
        } else {
          chat.updateRoomDetails(roomId, { customIcon: iconOrUrl, iconUrl: undefined } as any);
        }
      },
      assignRoomStaff: chat.assignRoomStaff,
      removeRoomStaff: chat.removeRoomStaff,
      presetIcons: PRESET_ROOM_ICONS
    };
  }
  return context;
};
