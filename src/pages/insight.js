import * as React from 'react';
import { graphql } from 'gatsby'

import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Logo from '../components/logo.inline.svg';
import Navigation from '../components/Navigation';


export default function Insight({ data }) {
  return (
    <Container>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        <Logo />
      </Box>
      <Box>
        <Navigation />
      </Box>
    </Container>
  )
}