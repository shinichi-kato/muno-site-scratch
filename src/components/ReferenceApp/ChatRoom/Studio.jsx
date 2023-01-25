import React, { useState, useContext, useMemo, useRef } from 'react';
import { withPrefix } from 'gatsby';
import { alpha } from '@mui/material/styles';
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

const DELAY_MSEC = 1800;
// const PANEL_SIZE_MAX_PERCENT = 50;
// const PANEL_SIZE_MIN_PERCENT = 30;

function LRBalloon({ message }) {
  return (
    <Box
      display="flex"
      flexDirection="row"
      alignSelf={ALIGN_SELF[message.person]}
    >
      <Box
        sx={{
          position: "relative",
          background: message.backgroundColor,
          color: "#ffffff",
          borderRadius: "15px",
          padding: "0.5em",
          "&:after": {
            content: '""',
            position: "absolute",
            display: "block",
            width: "0",
            zIndex: "1",
            borderStyle: "solid",
            borderColor: `${message.backgroundColor} transparent`,
            borderWidth: "19px 12px 0",
            bottom: "-16px",
            [SIDE[message.person]]: "30px",
            marginLeft: "-12px",
          }
        }}
      >
        <Typography variant="body1">{message.text}</Typography>
        <Typography variant="caption">{message.name}</Typography>
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
        <Avatar alt={message.name} src={withPrefix(message.avatarURL)} />
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

export default function Studio({ log, writeLog, closeness }) {
  /*
      チャットルームの最小の構成である、
      最新の吹き出し一つ（チャットボット or ユーザ or 第三者)、
      チャットボットとユーザのキャラクタ画像、
      ユーザのテキスト入力窓
      を生成する。レイアウトはスマホの縦長画面の半分以下になると
      思われるが、これをmodal表示することでスマホのソフトキーボードを
      が表示されても隠れないことが狙いである。

      closenessはチャットボットとユーザの親密さで、0以上1以下の実数値を
      とる。値は1が親密、0が親密でないことを表す。
      親密度を変えるルールがまだ整備できていないので、以降の実装は
      先送りにする。なお、実装にはuseMeasureを試すこと

      --- 先送り -----------------------------------------------------
      これをユーザとチャットボットのアバターの間の距離として表現する。
      親密度が1のときはUserPanel,FairyPanelの幅をそれぞれ50%とし、
      表示範囲内いっぱいに拡大されて隙間がない表示になる。
      親密度が0のときは幅を30%などとし、アバターは小さめに、間が離れた
      表示にする。
      -----------------------------------------------------------------
      
      */

  const [userInput, setUserInput] = useState("");
  const auth = useContext(AuthContext);
  const bot = useContext(BiomeBotContext);
  const botRef = useRef(bot);
  const message = log[0];

  // const panelWidth = (PANEL_SIZE_MIN_PERCENT - PANEL_SIZE_MAX_PERCENT) * closeness
  //                    + PANEL_SIZE_MAX_PERCENT;
  const panelWidth = 180;


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
    setTimeout(() => {
      botRef.current.execute(new Message({
        text: userInput,
        name: auth.displayName,
        person: 'user',
        avatarURL: auth.photoURL,
        backgroundColor: auth.backgroundColor,
      }), writeLog)
    }, DELAY_MSEC);

    setUserInput("");
    event.preventDefault();
  }

  const memorizedUserPanel = useMemo(() =>
    <UserPanel
      panelWidth={panelWidth}
    />
    , [panelWidth]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      sx={{ paddingBottom: 2 }}
    >
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
      {log.length > 0 &&
        <Balloon message={message} />
      }
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
      >
        <FairyPanel
          panelWidth={panelWidth}
        />
        {memorizedUserPanel}

      </Box>
    </Box>
  )
}