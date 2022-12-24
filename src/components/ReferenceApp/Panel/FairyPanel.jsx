import React from "react";
import Box from '@mui/material/Box';


export default function FairyPanel(props) {
  /*
    fairyのavatarと背景を表示する。
    props.status | 説明
  ---------------|----------
  false          | 灰色の背景のみ
  true           | 色付きの背景＋avatar
  */

  const status = props.status;
  const width = props.panelWidth;
  const height = width * 1.5;

  let bgColor = status ? props.backgroundColor : '#dddddd33';
  
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
      {status &&
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
            src={props.photoURL}
            alt={props.photoURL}
             />
        </Box>
      }
    </Box>
  )
}