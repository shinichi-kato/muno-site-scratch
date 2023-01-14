import React, { useContext, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';

import Studio from './Studio';
import { BiomeBotContext } from '../BiomeBot-0.10/BiomeBotProvider';
import { EcosystemContext } from '../Ecosystem/EcosystemProvider';
import { Message } from '../message'

import LogViewer from './LogViewer';

const panelWidth = 180; // 120,160,192

export default function ChatRoom({ log, writeLog }) {
  const ecosystem = useContext(EcosystemContext);
  const ecosystemRef = useRef(ecosystem);
  const bot = useContext(BiomeBotContext);
  const botRef = useRef(bot);
  const change = ecosystemRef.current.change;

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

  useEffect(()=>{
    if(change !== null){
      botRef.current.execute(
        new Message('trigger', {
          name: null,
          text: `{enter_${change}}`
        }),
        writeLog
      );
      ecosystem.dispatch({type:'dispatched'});
    }
  },[change, ecosystem, ecosystem.dispatch, writeLog]);


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
        sx={{
          height:"448px"
        }}
        closeness={closeness}
        log={log}
        writeLog={writeLog} />
      <Box
        sx={{
          height:"calc (100vh - 448px)",
          overflowY: "scroll",
        }}
        flexGrow={1}
      >
        <LogViewer log={log} />
      </Box>
    </Box>
  )
}