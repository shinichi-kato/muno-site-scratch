import React from "react";

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function Footer(){
  return(
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        p: 2,
        m: 0,
        height: "20vh",
        width: "100%",
        background: "linear-gradient(118deg, rgba(255,238,89,1) 0%, rgba(255,247,172,1) 100%);",
      }}
    >
      <Box>
        <Typography>Copyright(c) 1999-2022, 人工無脳は考える</Typography>
      </Box>

    </Box>
  )
}