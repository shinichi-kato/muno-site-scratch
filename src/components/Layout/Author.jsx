import React from "react";
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skato from '../Contacts/skato.png';

export default function Author() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        pb: 2,
      }}
    >
      <Box sx={{flex: 1}}></Box>
      <Box sx={{p:1}}>
        <Avatar
          alt="Shinichi Kato"
          src={Skato}
          sx={{ width: 48, height: 48 }} />
      </Box>
      <Box sx={{p:1}}>
        <Typography variant="h6">加藤真一 Ph. D. </Typography>
        <Typography variant="caption">チャットボット研究者</Typography>
      </Box>
    </Box>
  )
}