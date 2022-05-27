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
        backgroundPosition: "top right 50%",
        width: "100%",
        maxWidth: "1100px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignSelf: "center"
      }}>
      <Box
        sx={{ paddingTop: "250px" }}
      >
        <Typography variant="h1" align="center"
          sx={{
            fontSize: { xs: "2.5rem", sm: "3.5rem", md: "5rem" }
          }}
        >人工無脳は考える</Typography>
      </Box>
      <Box
        sx={{
          paddingLeft: { xs: "1rem", sm: "13%", md: "20%" },
          paddingTop: "16px",
          paddingBottom: "32px"
        }}
      >
        <Typography variant="subtitle1">
          人工無脳、またはチャットボットは人間のような知能を持っていません。<br />
          にもかかわらず私達は彼らとの会話に魅力を感じ、癒やされ、<br />
          時には感情を揺さぶられます。<br />
          それはなぜなのか。<br />
          チャットボットとは何なのか。<br />
          一見単純に見えるプログラムの奥に潜む、ディープな世界を探ります。
        </Typography>
      </Box>
    </Box >
  )
}