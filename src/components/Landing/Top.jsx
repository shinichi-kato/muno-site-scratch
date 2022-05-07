import * as React from 'react';
import Box from '@mui/material/Box';
import mainBg from './main.png';
import Typography from '@mui/material/Typography';

export default function Top() {
  return (
    <Box
      sx={{
        backgroundImage: `url(${mainBg})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        width: "1024px",
        height: 619,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}>
      <Box
        sx={{ paddingTop: "250px" }}
      >
        <Typography variant="h1" align="center">人工無脳は考える</Typography>
      </Box>
      <Box
      sx={{paddingLeft: "130px",paddingTop: "16px"}}>
        <Typography variant="subtitle1">
          人工無脳、またはチャットボットは人間のような知能を持っていません。<br/>
          にもかかわらず私達は彼らとの会話に魅力を感じ、癒やされ、<br/>
          時には感情を揺さぶられます。<br/>
          それはなぜなのか。<br/>
          チャットボットとは何なのか。<br/>
          一見単純に見えるプログラムの奥に潜む、ディープな世界を探ります。
        </Typography>
      </Box>
    </Box>
  )
}