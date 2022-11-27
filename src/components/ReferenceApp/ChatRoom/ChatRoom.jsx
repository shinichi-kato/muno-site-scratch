import React, { useContext, useRef, useEffect, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import SendIcon from '@mui/icons-material/Send';

import { BiomebotContext } from '../biomebot/BiomebotProvider';
import { AuthContext } from "../Auth/AuthProvider";
import { EcosystemContext } from '../Ecosystem/EcosystemProvider';

export default function ChatRoom() {
  const auth = useContext(AuthContext);
  const ecosystem = useContext(EcosystemContext);
  const ecosystemRef = useRef(ecosystem);
  const bot = useContext(BiomebotContext);
  const botRef = useRef(bot);

  const [userInput, setUserInput] = useState("");
  function handleChangeUserInput(event) {
    setUserInput(event.target.value);
  }

  function handleUserSubmit(event) {
    props.writeLog(new Message('speech', {
      text: userInput,
      name: auth.displayName,
      person: 'user',
      mood: 'peace',
      avatarPath: auth.photoURL,
      backgroundColor: auth.backgroundColor,
      site: ecosystem.site,
    }));

    // 後でtextの中身を直接いじるのでMessageのコピーを新たに作って渡す
    botRef.current.execute(new Message('speech', {
      text: userInput,
      name: auth.displayName,
      person: 'user',
      mood: 'peace',
      avatarPath: auth.photoURL,
      backgroundColor: auth.backgroundColor,
    }), props.writeLog);

    setUserInput("");
    event.preventDefault();
  }
  
  const memorizedUserPanel = useMemo(() =>
  <UserPanel
    panelWidth={panelWidth[panelSize]}
    user={auth}
  />
  , [auth, panelSize]);

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
      <Box>
        <InputBase
          sx={{
            ml: 1,
            flex: 1,
          }}
          value={userInput}
          onChange={handleChangeUserInput}
          fullWidth
          inputProps={{ 'aria-label': 'text' }}
          endAdornment={
            <IconButton
              onClick={handleUserSubmit}
              color="primary"
            >
              <SendIcon />
            </IconButton>
          }
        />
      </Box>
      <Box
        flexGrow={1}
      >
        <LogViewer log={log} />
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0
        }}
      >
        <FairyPanel
          panelWidth={panelWidth[panelSize]}
          backgroundColor={bot.state.config.backgroundColor}
          photoURL={bot.photoURL}
          status={bot.state.status}
        />
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          right: 0
        }}>
        {memorizedUserPanel}
      </Box>
    </Box>
  )
}