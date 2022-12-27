import React,{ useContext } from "react";
import Box from '@mui/material/Box';
import { BiomeBotContext } from '../BiomeBot-0.10/BiomeBotProvider';


export default function FairyPanel(props) {
  /*
    fairyのavatarと背景を表示する。
    props.status | 説明
  ---------------|----------
  false          | 灰色の背景のみ
  true           | 色付きの背景＋avatar
  */

  const bot = useContext(BiomeBotContext);
  const width = props.panelWidth;
  const height = width * 4/3;

  let bgColor = bot.isReady ? bot.backgroundColor : '#dddddd33';
  
  return (
    <Box
      sx={{
        width: width,
        height: height,
        position: "relative"
      }}
      >
      <Box
        sx={{
          width: width,
          height: width,
          borderRadius: "0% 100% 100% 0% / 100% 100% 0% 0%",
          backgroundColor: bgColor,
          position: "absolute",
          bottom:0,
          left:0,
        }}
      />
      {bot.isReady &&
        <Box
          sx={{
            width: width,
            height: height,
          }}
          position="absolute"
          bottom={0}
          right={0}
        >
          <img
            style={{
              width: width,
              height: height,
            }}
            src={bot.avatarURL}
            alt={bot.avatarURL}
             />
        </Box>
      }
    </Box>
  )
}