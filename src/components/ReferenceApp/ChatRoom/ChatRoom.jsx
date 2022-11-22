import * as React from 'react';
import Container from '@mui/material/Container';

export default function Chat(){
  return (
    <Container
    fixed
    maxWidth="xs"
    disableGutters
    sx={{
      height: "100vh",
      background: "linear-gradient(3deg, rgba(217,255,255,1) 0%, rgba(71,204,255,1) 100%)",
    }}
  >
    {props.children}

  </Container>
  )
}