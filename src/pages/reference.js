import React, { useState, useCallback } from "react";

import AuthProvider from '../components/ReferenceApp/Auth/AuthProvider';
import BiomebotProvider from '../components/ReferenceApp/BiomeBot-0.10/BiomeBotProvider';
import EcosystemProvider from '../components/ReferenceApp/Ecosystem/EcosystemProvider';
import ChatRoom from '../components/ReferenceApp/ChatRoom/ChatRoom';

const URL = '/chatbot/biomebot/reference-1.0.json';

export default function RefAppPage() {
  const [appState, setAppState] = useState(null);
  const [log, setLog] = useState([]);
  
  const handleWriteLog = useCallback(message => {
    if(message.text !== '{NOP}'){
      setLog(prev => [message, ...prev]);
    }
  },[]);

  const handleBotReady = useCallback(()=>{
     setAppState('chatroom'); 
    },[]);



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
              "ロード中"
          }
        </BiomebotProvider>
      </EcosystemProvider>
    </AuthProvider>
  )
}