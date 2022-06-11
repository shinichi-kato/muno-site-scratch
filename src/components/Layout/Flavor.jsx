import React from "react";
import Box from '@mui/material/Box'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import Typography from '@mui/material/Typography';

export default function Flavor(props){
  return (
    <Box
      sx={{
        py: "1.5rem",
        pl: "20%",
        pr: "5%",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Box
        sx={{ display: "flex", flexDirection: "row" }}
      >
        <Box sx={{ alignSelf: "flex-start" }}>
          <FormatQuoteIcon sx={{transform: "rotate(180deg)"}}/>
        </Box>
        <Box sx={{ flex: 1 }}>
          <i>{props.children}</i>
        </Box>
        <Box sx={{ alignSelf: "flex-end" }}>
          <FormatQuoteIcon />
        </Box>
      </Box>
      <Box sx={{ alignSelf: "flex-end", pr: "1.5rem"}}>
        <i>ー {props.authority}</i>
      </Box>
      <Box sx={{ alignSelf: "flex-end", pr: "1rem"}}>
        <Typography variant="caption">{props.work}</Typography>
      </Box>
      

    </Box>
  )
}