import React, { useContext, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';

import Studio from './Studio';
import { BiomeBotContext } from '../BiomeBot-0.10/BiomeBotProvider';
// import { EcosystemContext } from '../Ecosystem/EcosystemProvider';

import LogViewer from './LogViewer';

const panelWidth = 192; // 120,160,192

export default function ChatRoom({ log, writeLog }) {
  // const ecosystem = useContext(EcosystemContext);
  // const ecosystemRef = useRef(ecosystem);
  const bot = useContext(BiomeBotContext);
  const botRef = useRef(bot);

  useEffect(() => {
    if (bot.isReady) {
      let code = {
        intent: 'enter',
        text: '',
        owner: 'system'
      };
      botRef.current.execute(code, writeLog)
    }
  }, [bot.isReady, writeLog]);


  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        position: 'relative',
        width: "100%",
        height: "100vh", // 子がflexGrowを使うコンポーネントは高さを指定
        padding: "0px",
      }}
    >
      <Studio
        panelWidth={panelWidth}
        log={log}
        writeLog={writeLog} />
      <Box
        flexGrow={1}
      >
        <LogViewer log={log} />
      </Box>
    </Box>
  )
}