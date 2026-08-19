import React from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import { LandingPage } from './components/LandingPage';
import { RoomsPage } from './components/RoomsPage';
import { ChatLayout } from './components/ChatLayout';
import { ToastContainer } from './components/ToastContainer';
import { BlockConfirmModal } from './components/BlockConfirmModal';

const MainRouter: React.FC = () => {
  const { currentUser, currentView } = useChat();

  if (!currentUser) {
    return <LandingPage />;
  }

  if (currentView === 'rooms') {
    return <RoomsPage />;
  }

  return <ChatLayout />;
};

export default function App() {
  return (
    <ChatProvider>
      <ToastContainer />
      <BlockConfirmModal />
      <MainRouter />
    </ChatProvider>
  );
}

