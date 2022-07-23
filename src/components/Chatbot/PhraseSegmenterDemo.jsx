import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Input from '@mui/material/Input';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';

import PhraseSegmenter from './engine/phraseSegmenter';

const phraseSegmenter = new PhraseSegmenter();

export default function PhraseSegmenterDemo() {
  const [text, setText] = useState("猫が地震で飛び上がり、近くにあった皿が割れた");
  const [result, setResult] = useState("");

  function handleChangeText(event) {
    setText(event.target.value);
  }

  function handleSubmit(event) {
    let nodes = phraseSegmenter.segment(text);

    setResult(nodes.join(" | "));
    setText("");

    event.preventDefault();
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        width: "100%",
        backgroundColor: "#dddddd",
        p: 1,
        borderRadius: 3,
        marginBottom: 2,
        marginTop: 1
      }}
    >
      <Box>
        <Typography>PhraseSegmenter Demo</Typography>
      </Box>
      <Box>
        結果：<Typography>{result}</Typography>
      </Box>
      <Box>
        <form onSubmit={handleSubmit}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row"
            }}
          >
            <Box
              sx={{flex:1}}
            >
              <Input
                value={text}
                onChange={handleChangeText}
                fullWidth
              />
            </Box>
            <Box>
              <IconButton
               onClick={handleSubmit}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </form>
      </Box>
    </Box>
  )
}