import * as React from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { Link as GatsbyLink } from 'gatsby';
import { grey } from '@mui/material/colors';
import { StaticImage } from 'gatsby-plugin-image';
import Box from '@mui/material/Box';


export default function Book() {
  return (
    <Grid container
      sx={{ paddingLeft: 4, paddingRight: 2, py: 2 }}
    >
      <Grid item container spacing={2}
        sx={{
          p: 1,
          borderRadius: 2,
          backgroundColor: grey.A200,
        }}
      >
        <Grid item xs={12}>
          <Typography variant="h2">書籍の紹介</Typography>
        </Grid>
        <Grid item xs={12} sm={4}
        >
          <Box sx={{ mx: {sx: "10px", md: "50px" }} }>
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
              <StaticImage
                src='./yumemiru.jpg'
                alt="夢みるプログラム"
                layout="fixed"
                width={180}
              />
            </GatsbyLink>
          </Box>

        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography variant="h3">夢みるプログラム</Typography>
          <Typography>
            出版社: ラトルズ<br />初版: 2016/8/25
          </Typography>
          <Typography>
            日本語のチャットボットは1990年代に発達し、様々な種類の会話アルゴリズムや新しい試みが見られました。
            それらの構造についての議論を通して心のメカニズムについて考察しています。
          </Typography>
          <Link href="https://amzn.to/3tRYhS6">amazonで購入</Link>
        </Grid>
      </Grid>
    </Grid>
  )
}