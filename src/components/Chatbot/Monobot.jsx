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
import { render } from 'react-dom';

const MAX_LOG_LENGTH = 5;

export default function Chatbot({ src }) {
  const [script, setScript] = useState({
    avatar: "",
    name: "",
    backgroundColor: ""
  });
  const [message, setMessage] = useState(null);
  const [cache, setCache] = useState({ status: "unload", src: null });
  const [log, setLog] = useState();
  const [userText, setUserText] = useState("");

  //-------------------------------------------
  // chatbotのロード

  useEffect(() => {
    if (cache.status === 'unload' || src !== cache.src) {
      setMessage("読み込み中 ...")
      fetch(`${src}/chatbot.json`)
        .then(res => res.json())
        .then(
          result => {
            setScript(src, result);
            setMessage("計算中 ...")
            setCache(matrixize(result.script));
            setMessage(null);
          },
          error => {
            setMessage(error.message);
          }
        )

    }
  }, [cache.status, cache.src, src]);

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
  }, [cache.status])

  function handleChangeInput(event) {
    setUserText(event.target.value);
  }

  function handleSubmit(event) {
    renderMessage('user', userText);

    const result = retrieve(userText, cache);

    if (result.score > script.precision) {
      const cands = cache.outScript[result.index];
      const cand = cands[Math.floor(Math.random() * cands.length)];
      renderMessage('bot', cand);
    }

    event.preventDefault();
  }

  function renderMessage(person, text) {
    if (person === 'bot') {
      setLog(prev =>
        [...prev.slice(-MAX_LOG_LENGTH),
        <Box
          sx={{
            position: "relative",
            background: "#eeeeee",
            color: "#000000",
            borderRadius: "5px",
            p: 0,
            "& :after": {
              content: "",
              position: "relative",
              display: "block",
              width: 0,
              zIndex: 1,
              borderStyle: "solid",
              borderColor: "transparent #000000",
              borderWidth: "8px 8px 8px 0",
              top: "50%",
              left: "-8px",
              marginTop: "-8px",
            }
          }}
        >
          {text}
        </Box>
        ]);
    }
    else if (person === 'user') {
      setLog(prev =>
        [...prev.slice(-MAX_LOG_LENGTH),
        <Box
          sx={{
            position: "relative",
            background: "#eeeeee",
            color: "#000000",
            borderRadius: "5px",
            p: 0,
            "& :after": {
              content: "",
              position: "relative",
              display: "block",
              width: 0,
              zIndex: 1,
              borderStyle: "solid",
              borderColor: "transparent #000000",
              borderWidth: "8px 0 8px 8px",
              top: "50%",
              right: "-8px",
              marginTop: "-8px",
            }
          }}
        >
          {text}
        </Box>
        ]);
    }

  }

  const avatarUrl = `${src}/${script.avatar}`;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        backgroundColor: script.backgroundColor,
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
          {log}
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