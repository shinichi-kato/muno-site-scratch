import React, { useState, useContext, useMemo, useRef } from 'react';
import { alpha } from '@mui/material/styles';
import { css } from '@emotion/react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';

import { AuthContext } from "../Auth/AuthProvider";
import { BiomeBotContext } from '../BiomeBot-0.10/BiomeBotProvider';
import { Message } from '../message';
import FairyPanel from '../Panel/FairyPanel';
import UserPanel from '../Panel/UserPanel';

const SIDE = {
  'bot': 'left',
  'user': 'right',
};
const ALIGN_SELF = {
  'bot': 'flex-start',
  'user': 'flex-end'
};

function LRBalloon({ message }) {
  return (
    <Box
      display="flex"
      flexDirection="row"
      alignSelf={ALIGN_SELF[message.person]}
    >
      <Box
        css={css`
            {
              position: relative;
              background: ${message.backgroundColor};
              color: #FFFFFF;
              border-radius: 15px;
              padding: 0.5em;
            }
            .bubble:after {
                content: '';
                position: absolute;
                display: block;
                width: 0;
                z-index: 1;
                border-style: solid;
                border-color: ${message.backgroundColor} transparent;
                border-width: 19px 12px 0;
                bottom: -19px;
                ${SIDE[message.person]}: 18px;
                margin-left: -12px;
            }
          `}
      >
        <Typography variant="caption1">{message.name}</Typography>
        <Typography variant="body1">{message.text}</Typography>
      </Box>
    </ Box>
  );
}

function OthersBalloon({ message }) {
  return (
    <Box
      display="flex"
      flexDirection="row"
      alignSelf="flex-start"
    >
      <Box>
        <Avatar alt={message.name} src={message.avatarURL} />
      </Box>
      <Box
        sx={{
          borderRadius: " 15px 15px 0px 15px",
          padding: "0.5em",
          marginRight: 4,
          backgroundColor: message.backgroundColor,
        }}
      >
        <Typography variant="caption">{message.name}</Typography>
        <Typography variant="body1">{message.text}</Typography>
      </Box>
    </Box>
  )
}

function SystemMessage({ message }) {
  return (
    <Box
      alignSelf="center"
    >
      <Typography>{message.text}</Typography>
    </Box>
  )
}

function Balloon({ message }) {
  switch (message.person) {
    case 'user':
    case 'bot':
      return <LRBalloon message={message} />
    case 'others':
      return <OthersBalloon message={message} />
    default:
      return <SystemMessage message={message} />
  }
}

export default function Studio({ log, writeLog, panelWidth }) {
  /*
      チャットルームの最小の構成である、
      最新の吹き出し一つ（チャットボット or ユーザ or 第三者)、
      チャットボットとユーザのキャラクタ画像、
      ユーザのテキスト入力窓
      を生成する。レイアウトはスマホの縦長画面の半分以下になると
      思われるが、これをmodal表示することでスマホのソフトキーボードを
      が表示されても隠れないことが狙いである。


      */

  const [userInput, setUserInput] = useState("");
  const auth = useContext(AuthContext);
  const bot = useContext(BiomeBotContext);
  const botRef = useRef(bot);
  const message = log[0];

  function handleChangeUserInput(event) {
    setUserInput(event.target.value);
  }

  function handleUserSubmit(event) {
    writeLog(new Message({
      text: userInput,
      name: auth.displayName,
      person: 'user',
      avatarURL: auth.photoURL,
      backgroundColor: auth.backgroundColor,
    }));

    // 後でtextの中身を直接いじるのでMessageのコピーを新たに作って渡す
    botRef.current.execute(new Message({
      text: userInput,
      name: auth.displayName,
      person: 'user',
      avatarURL: auth.photoURL,
      backgroundColor: auth.backgroundColor,
    }), writeLog);

    setUserInput("");
    event.preventDefault();
  }
  console.log("log=",log)

  const memorizedUserPanel = useMemo(() =>
    <UserPanel
      panelWidth={panelWidth}
    />
    , [panelWidth]);

  return (
    <Box
      display="flex"
      flexDirection="column"
    >
      {log.length >0 &&
        <Balloon message={message} />

      }
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="space-evenly"
      >
        <FairyPanel
          panelWidth={panelWidth}
        />
        {memorizedUserPanel}

      </Box>
      <Box
        alignSelf="stretch"
      >
        <Paper
          sx={{
            display: "flex",
            alignItems: "center",
            width: "calc( 100% - 4px)",
            p: '2px 4px',
            m: '4px',
            borderRadius: '10px',
            flexGrow: 1,
            backgroundColor: alpha('#ffffff', 0.2)
          }}
          component="form"
          onSubmit={handleUserSubmit}
          elevation={0}
        >
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
        </Paper>
      </Box>
    </Box>
  )
}