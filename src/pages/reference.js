import * as React from 'react';
import AuthProvider from '../src/components/ReferenceApp/Auth/AuthProvider';
import BiomebotProvider from '../src/components/ReferenceApp/Biomebot-0.10/BiomebotProvider';
import ChatRoom from '../src/components/ReferenceApp/ChatRoom/ChatRoom';

export default function RefAppPage() {
  return (
    <AuthProvider>
      <BiomebotProvider>
        <ChatRoom />
      </BiomebotProvider>
    </AuthProvider>
  )
}