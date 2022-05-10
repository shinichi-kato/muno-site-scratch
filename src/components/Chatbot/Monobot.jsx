/*
Monobot
==================

一つの辞書のみからなるチャットボット


*/

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Input from '@mui/material/Input';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/AccountCircle';

import { matrixize } from './matrixize';
import { retrieve } from './retrieve';

const MAX_LOG_LENGTH = 5;

function RightBalloon({ text, backgroundColor }) {
  return (
    <Box
      sx={{
        p: 1
      }}>
      <Box
        sx={{
          position: "relative",
          background: backgroundColor,
          color: "#000000",
          borderRadius: "5px",
          p: 1,
          "&::after": {
            content: '""',
            position: "absolute",
            display: "block",
            width: 0,
            zIndex: 1,
            borderStyle: "solid",
            borderColor: `transparent ${backgroundColor}`,
            borderWidth: "8px 0 8px 8px",
            top: "50%",
            right: "-8px",
            marginTop: "-8px",
          }
        }}
      >
        {text}
      </Box>
    </Box>

  )
}

function LeftBalloon({ text, backgroundColor }) {
  return (
    <Box sx={{ p: 1 }}>
      < Box
        sx={{
          position: "relative",
          background: backgroundColor,
          color: "#000000",
          borderRadius: "5px",
          p: 1,
          "&::after": {
            content: '""',
            position: "absolute",
            display: "block",
            width: 0,
            zIndex: 1,
            borderStyle: "solid",
            borderColor: `transparent ${backgroundColor}`,
            borderWidth: "8px 8px 8px 0",
            top: "50%",
            left: "-8px",
            marginTop: "-8px",
          }
        }}
      >
        {text}
      </Box >
    </Box>

  )
}


export default function Chatbot({ source }) {
  const [script, setScript] = useState({
    avatar: "",
    name: "",
    backgroundColor: ""
  });
  const [message, setMessage] = useState(null);
  const [cache, setCache] = useState({ status: "unload", source: null });
  const [log, setLog] = useState([]);
  const [userText, setUserText] = useState("");

  //-------------------------------------------
  // chatbotのロード

  useEffect(() => {
    if (cache.status === 'unload') {
      setMessage("読み込み中 ...")
      fetch(`${source}/chatbot.json`)
        .then(res => res.json())
        .then(
          result => {
            setScript(result);
            setMessage("計算中 ...")
            setCache(matrixize(source, result.script));
            setMessage(null);
          },
          error => {
            setMessage(error.message);
          }
        )
    }
  }, [cache.status, cache.source, source]);

  // -------------------------------------------------
  // 開始時に__start__を発言
  //

  useEffect(() => {
    if (cache.status === 'loaded') {
      const result = retrieve("__start__", cache)
      const cands = cache.outScript[result.index];
      const cand = cands[Math.floor(Math.random() * cands.length)];

      renderMessage('bot', cand);

      setCache(prev => ({
        ...prev,
        status: 'ok'
      }))
    }

    if (cache.status === 'error') {
      setMessage(cache.message);
    }
  }, [cache, cache.status])

  function handleChangeInput(event) {
    setUserText(event.target.value);
  }

  function handleSubmit(event) {
    renderMessage('user', userText);

    let result;

    result = retrieve(userText, cache);
    if (result.score < script.precision) {
      result = retrieve("__not_found__", cache);
    }

    const cands = cache.outScript[result.index];
    const cand = cands[Math.floor(Math.random() * cands.length)];

    if(cand !== '__nop__'){
      renderMessage('bot', cand);
    }

    setUserText("");

    event.preventDefault();
  }

  function renderMessage(person, text) {
    setLog(prev =>
      [...prev.slice(-MAX_LOG_LENGTH),
      { person: person, text: text }
      ]
    )
  }

  const avatarUrl = `${source}/${script.avatar}`;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        backgroundColor: "#dddddd",
        p: 1,
        borderRadius: 3,
      }}
    >
      <Box
        sx={{
          width: "210px",
          p: 1
        }}
      >
        <img src={avatarUrl} alt={avatarUrl}
          style={{
            width: "200px",
            height: "300px"
          }}
        />
        <Typography align="center">{script.name}</Typography>

      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          p: 1,
          flex: 1
        }}
      >
        <Box
          sx={{ flexGrow: 1 }}
        >
          {message}
          {log.map((message, index) =>
            message.person === 'bot'
              ?
              <LeftBalloon
                text={message.text}
                key={index}
                backgroundColor={script.backgroundColor}
              />
              :
              <RightBalloon
                text={message.text}
                key={index}
                backgroundColor="#ffffff"
              />
          )}
        </Box>
        <Box>
          <form onSubmit={handleSubmit}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row"
              }}
            >
              <Box>
                <Input
                  value={userText}
                  onChange={handleChangeInput}
                  disabled={cache.status !== 'ok'}
                />
              </Box>
              <Box>
                <IconButton>
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </form>
        </Box>
      </Box>
    </Box>
  )
}