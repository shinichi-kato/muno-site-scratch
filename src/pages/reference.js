import React, { useState, useEffect, useRef } from "react";

import AuthProvider from '../src/components/ReferenceApp/Auth/AuthProvider';
import BiomebotProvider from '../src/components/ReferenceApp/Biomebot-0.10/BiomebotProvider';
import EcosystemProvider from '../src/components/ReferenceApp/EcosystemProvider/EcosystemProvider';
import ChatRoom from '../src/components/ReferenceApp/ChatRoom/ChatRoom';

const URL = './chatbot/biomebot/reference-1.0.json';

export default function RefAppPage() {
  const [appState, setAppState] = useState(null);
  const [log, setLog] = useState([]);

  const handleWriteLog = useCallback(message => {
    setLog(prev => [message, ...prev]);
  });

  function handleBotReady() { setAppState('chatroom'); }


  return (
    <AuthProvider>
      <EcosystemProvider>
        <BiomebotProvider
          url={URL}
          writeLog={handleWriteLog}
          handleBotReady={handleBotReady}
        >
          {
            appState === 'chatroom' ?
              <ChatRoom
                writeLog={handleWriteLog}
                log={log}
              />
              :
              <Landing />
          }
        </BiomebotProvider>
      </EcosystemProvider>
    </AuthProvider>
  )
}