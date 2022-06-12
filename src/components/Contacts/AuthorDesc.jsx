import React from "react";
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skato from './skato.png';

export default function AuthorDesc() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        ml: "10%",
        maxWidth: "md"
      }}
    >
      <Box
        sx={{p:2}}
      >
        <Avatar
          alt="Shinichi Kato"
          src={Skato}
          sx={{ width: 100, height: 100 }} />
      </Box>
      <Box sx={{p:2}}>
        <Typography variant="h5">加藤真一 Ph. D. </Typography>
        <Typography variant="body1">高校時代にPC-9801上で動く人工無脳に出会い、面白さとともに限界を感じる。
        大学時代に「人工無脳は考える」を立ち上げ考察を試みるもほとんどなすすべなし。
        その後、40代ごろから心理学やカウンセリング技法を学び、
        さらに身近な人間関係を見つめなおす経験を経て、すべては人工無脳研究の糧であったと考えるようになる。
        現在はチャットボットを発達障害児支援に用いる研究に参加。        
        大学では化学・無機材料系を専攻し博士号を取得。現在株式会社村田製作所勤務。
        業務は人工無脳と全く関係なかったが、献本をきっかけに材料×機械学習の仕事に変わった。
        </Typography>
      </Box>
    </Box>
  )
}