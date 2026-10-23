import React from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import { RoomsProvider } from './context/RoomsContext';
import { LandingPage } from './components/LandingPage';
import { RoomsPage } from './components/RoomsPage';
import { ChatLayout } from './components/ChatLayout';
import { ToastContainer } from './components/ToastContainer';
import { BlockConfirmModal } from './components/BlockConfirmModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { DynamicSEO } from './components/DynamicSEO';

const MainRouter: React.FC = () => {
  const { currentUser, currentView } = useChat();

  if (!currentUser || currentView === 'landing') {
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
      <RoomsProvider>
        <DynamicSEO />
        <ToastContainer />
        <BlockConfirmModal />
        <MainRouter />
        <CookieConsentBanner />
      </RoomsProvider>
    </ChatProvider>
  );
}

