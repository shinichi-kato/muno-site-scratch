/*
Monobot
==================

一つの辞書のみからなるチャットボット


*/

import React, { useState, useEffect, useReducer } from 'react';
import { withPrefix } from 'gatsby';
import Link from '@mui/material/Link'
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Input from '@mui/material/Input';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';

import BowEncoder from './engine/bow-encoder';
import EchoDecoder from './engine/echo-decoder';
import HarvestEncoder from './engine/harvest-encoder';
import HarvestDecoder from './engine/harvest-decoder';

const codecs = {
  'BowEncoder': BowEncoder,
  'EchoDecoder': EchoDecoder,
  'HarvestEncoder': HarvestEncoder,
  'HarvestDecoder': HarvestDecoder,
}


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

const initialState = {
  encoder: null,
  decoder: null,
  avatar: "",
  name: "",
  backgroundColor: "",
  precision: 0,
  status: "unload",
  message: null,
  source: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'Load': {
      const script = action.script;

      let encoder = new codecs[script.encoder]();
      let decoder = new codecs[script.decoder]();
      encoder.learn(script);
      decoder.learn(script);
      
      return {
        ...state,
        encoder: encoder,
        decoder: decoder,
        avatar: script.avatar,
        name: script.name,
        backgroundColor: script.backgroundColor,
        precision: script.precision,
        status: "loaded",
        message: "",
        source: action.source,
      }
    }

    case 'Start': {
      return {
        ...state,
        status: "started",
        message: "",
      }
    }

    case 'Message': {
      return {
        ...state,
        message: action.message
      }
    }

    case 'Error': {
      return {
        ...state,
        status: "error",
        message: action.message
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`)
  }
}

const initialHarvest = ["",""];

export default function Chatbot({ source }) {
  const [log, setLog] = useState([]);
  const [userText, setUserText] = useState("");
  const [state, dispatch] = useReducer(reducer, initialState);
  const [harvest, setHarvest] = useState(initialHarvest);

  //-------------------------------------------
  // chatbotのロード

  useEffect(() => {
    if ( state.source !== source && state.status !== "error") {
      dispatch({ type: "Message", message: "読み込み中 ..." });
      fetch(withPrefix(`${source}/chatbot.json`))
        .then(res => res.json())
        .then(
          result => {
            dispatch({ type: "Message", message: "計算中 ..." });
            dispatch({ type: "Load", script: result, source: source })
          },
          error => {
            dispatch({ type: "Error", message: error.message });
          }
        )
    }
  }, [state.source, source, state.status]);

  // -------------------------------------------------
  // 開始時に__start__を発言
  //

  useEffect(() => {

    if (state.status === 'loaded') {
      const code = state.encoder.resolve("__start__");
      dispatch({ type: "Start" });
      renderMessage('bot', state.decoder.render({
        ...code,
        harvest: "..." // 初回にharvestはないのでdummy
      }));
    }
  }, [state.encoder, state.decoder, state.status])



  function handleChangeInput(event) {
    setUserText(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    renderMessage('user', userText);
    setUserText("");


    // 入力文字列を中間コードに
    let code = state.encoder.retrieve(userText);

    // 返答できない時は代わりに__not_found__に置き換える
    if (code.score < state.precision) {
      code = state.encoder.resolve("__not_found__");
    }


    // harvestがあれば記憶
    let h = harvest;
    if(code.harvests !== undefined && code.harvests.length !== 0){
      h = code.harvests[0];
      setHarvest(h);
    }

    // 内部コードをテキストにデコード
    let text = state.decoder.render({
      ...code,
      harvest: h
    });
    
    if (text !== '__nop__') {
      renderMessage('bot', text);
    }
  }

  function renderMessage(person, text) {
    setLog(prev =>
      [...prev.slice(-MAX_LOG_LENGTH),
      { person: person, text: text }
      ]
    )
  }

  const avatarUrl = withPrefix(`${source}/${state.avatar}`);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        backgroundColor: "#dddddd",
        p: 1,
        mb: 2,
        borderRadius: 3,
      }}
    >
      <Box
        sx={{
          width: "130px",
          p: 1
        }}
      >
        <img src={avatarUrl} alt={avatarUrl}
          style={{
            width: "120px",
            height: "180px"
          }}
        />
        <Typography align="center">{state.name}</Typography>
        <Link href={withPrefix(`${source}/chatbot.json`)}>辞書を見る</Link>
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
          {state.message}
          {log.map((message, index) =>
            message.person === 'bot'
              ?
              <LeftBalloon
                text={message.text}
                key={index}
                backgroundColor={state.backgroundColor}
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
                flexDirection: "row",
                alignItems: "stretch"
              }}
            >
              <Box
                sx={{ flex: 1 }}
              >
                <Input
                  sx={{
                    width: "100%",
                    backgroundColor: "rgba(255,255,255,0.8)",
                  }}
                  value={userText}
                  onChange={handleChangeInput}
                  disabled={state.status !== 'started'}
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