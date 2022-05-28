import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { Link as GatsbyLink } from 'gatsby';
import { grey } from '@mui/material/colors';


export default function Book() {
  return (
    <GatsbyLink to="/book"
      style={{
        color: "rgba(0,0,0,0.87)",
        textDecoration: "none",
        '&:hover': {
          color: "rgba(0,0,0,0.87)",
          textDecoration: "none",
        }
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          m: 2,
          p: 4,
          borderRadius: 2,
          backgroundColor: grey.A200

        }}
      >
        <Box>
          <Typography variant="h2">書籍の紹介</Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",

          }}
        >
          <Box
            sx={{ p: 1 }}
          >
            <a href="https://www.amazon.co.jp/%E5%A4%A2%E3%81%BF%E3%82%8B%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%A0-%E4%BA%BA%E5%B7%A5%E7%84%A1%E8%84%B3%E3%83%BB%E3%83%81%E3%83%A3%E3%83%83%E3%83%88%E3%83%9C%E3%83%83%E3%83%88%E3%81%A7%E8%80%83%E5%AF%9F%E3%81%99%E3%82%8B%E4%BC%9A%E8%A9%B1%E3%81%A8%E5%BF%83%E3%81%AE%E3%82%A2%E3%83%AB%E3%82%B4%E3%83%AA%E3%82%BA%E3%83%A0-%E5%8A%A0%E8%97%A4-%E7%9C%9F%E4%B8%80/dp/4899774540?&linkCode=li2&tag=jinkoumunouha-22&linkId=bd2dc16bfa4ab31e4b99f31cba788d45&language=ja_JP&ref_=as_li_ss_il"
              target="_blank"
              rel="noreferrer">
              <img
                border={0}
                src="//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=4899774540&Format=_SL160_&ID=AsinImage&MarketPlace=JP&ServiceVersion=20070822&WS=1&tag=jinkoumunouha-22&language=ja_JP"
                alt="夢みるプログラム"
              />
            </a>
            <img src="https://ir-jp.amazon-adsystem.com/e/ir?t=jinkoumunouha-22&language=ja_JP&l=li2&o=9&a=4899774540"
              width="1"
              height="1"
              border="0"
              alt=""
              style={{ border: "none", margin: 0 }}
            />
          </Box>
          <Box
            sx={{ p: 1 }}
          >
            <Typography variant="h3">夢みるプログラム</Typography>
            <Typography>
              出版社: ラトルズ<br />初版: 2016/8/25
            </Typography>
            <Typography>
              日本語のチャットボットは1990年代に発達し、様々な種類の会話アルゴリズムや新しい試みが見られました。
              それらの構造についての議論を通して心のメカニズムについて考察しています。
            </Typography>
            <Link href="https://amzn.to/3yeHhsf">amazonで購入</Link>
          </Box>

        </Box>
      </Box >
    </GatsbyLink>
  )
}