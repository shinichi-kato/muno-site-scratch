/*
Monobot
==================

チャットボット デモンストレーションUI

チャットボットはencoder, stateMachine, docoderの組み合わせで構成される。


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
import HarvestEncoder from './engine/harvest-encoder';
import PatternEncoder from './engine/pattern-encoder';
import EchoDecoder from './engine/echo-decoder';
import HarvestDecoder from './engine/harvest-decoder';
import BasicStateMachine from './engine/basic-state-machine';
import NamingStateMachine0 from './engine/naming-state-machine0';
import NamingStateMachine from './engine/naming-state-machine0';

import { db } from './engine/dbio';

const modules = {
  'BowEncoder': BowEncoder,
  'HarvestEncoder': HarvestEncoder,
  'PatternEncoder': PatternEncoder,
  'EchoDecoder': EchoDecoder,
  'HarvestDecoder': HarvestDecoder,
  'BasicStateMachine': BasicStateMachine,
  'NamingStateMachine0': NamingStateMachine0,
  'NamingStateMachine': NamingStateMachine,
}

function getModules(name) {
  if (name in modules) {
    return modules[name];
  }
  throw new Error(`invalid codec name ${name}`)
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
  stateMachine: null,
  decoder: null,
  avatar: "",
  name: "",
  backgroundColor: "",
  precision: 0,
  status: "unload",
  message: null,
  source: null,
  options: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'Load': {
      const script = action.script;
      const modules = action.modules;

      return {
        ...state,
        encoder: modules.encoder,
        stateMachine: modules.stateMachine,
        decoder: modules.decoder,
        avatar: script.avatar,
        name: script.name,
        backgroundColor: script.backgroundColor,
        precision: script.precision,
        status: "loaded",
        message: "",
        source: action.source,
        options: { ...action.options },
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


export default function Chatbot({ source, options }) {
  const [log, setLog] = useState([]);
  const [userText, setUserText] = useState("");
  const [state, dispatch] = useReducer(reducer, initialState);
  const [avatarUrl, setAvatarUrl] = useState("");

  //-------------------------------------------
  // chatbotのロード

  useEffect(() => {
    if (state.source !== source && state.status !== "error") {
      dispatch({ type: "Message", message: "読み込み中 ..." });
      fetch(withPrefix(`${source}/chatbot.json`))
        .then(res => res.json())
        .then(
          script => {
            (async () => {

              dispatch({ type: "Message", message: "計算中 ..." });

              await db.initialize(
                source,
                { 
                  '{BOT_NAME}': [script.name],
                  '{USER_NAME}': ['ユーザ'],
                }
              );

              let encoder = getModules(script.encoder);
              let decoder = getModules(script.decoder);
              let stateMachine = getModules(script.stateMachine || 'BasicStateMachine');

              encoder = new encoder(script);
              decoder = new decoder(script);
              stateMachine = new stateMachine(script);

              dispatch({
                type: "Load", script: script,
                source: source,
                options: options,
                modules: {
                  encoder: encoder,
                  decoder: decoder,
                  stateMachine: stateMachine,
                }
              });
            })();
          }
          ,
          error => {
            dispatch({ type: "Error", message: error.message });
          }
        )
    }
  }, [state.source, source, state.status]);

  // -------------------------------------------------
  // チャットボットの動作開始
  //

  useEffect(() => {

    if (state.status === 'loaded') {
      // stale effect化を防ぐためrun()の内容を展開
      const startingState = state.options ? state.options.startingState : null;
      console.log("startingState", startingState)

      let code = {
        intent: startingState || 'start',
        text: '',
        owner: 'system'
      };

      code = state.encoder.retrieve(code);
      code = state.stateMachine.run(code);
      let text = state.decoder.render(code);

      dispatch({ type: "Start" });
      renderMessage('bot', text, code);
    }
  }, [state.encoder, state.decoder, state.stateMachine, state.status])


  function handleChangeInput(event) {
    setUserText(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    renderMessage('user', userText);
    setUserText("");

    let code = {
      intent: '*',
      text: userText,
      owner: 'user',
    };

    code = state.encoder.retrieve(code);
    code = state.stateMachine.run(code);
    let text = state.decoder.render(code);

    renderMessage('bot', text, code);
  }

  function renderMessage(person, text, code) {
    if(text!=="{NOP}"){
      setLog(prev =>
        [...prev.slice(-MAX_LOG_LENGTH),
        { person: person, text: text }
        ]
      );
  
    }

    if(code){
      setAvatarUrl(withPrefix(
        code.intent === 'absent' || code.intent === 'stand_by'
          ? `${source}/absent.svg`
          : `${source}/${state.avatar}`
      ))
  
    }
  }

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