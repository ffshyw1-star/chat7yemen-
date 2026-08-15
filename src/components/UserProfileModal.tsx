import React from 'react';
import { useChat } from '../context/ChatContext';
import { ProfileView } from './ProfileView';

export const UserProfileModal: React.FC = () => {
  const { selectedUserForProfile, setSelectedUserForProfile } = useChat();

  if (!selectedUserForProfile) return null;

  return (
    <ProfileView
      user={selectedUserForProfile}
      onClose={() => setSelectedUserForProfile(null)}
      isModal={true}
    />
  );
};
