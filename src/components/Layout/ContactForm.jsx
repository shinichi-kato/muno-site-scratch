import React from "react";
import { styled } from '@mui/material/styles';
import Input from "@mui/material/Input";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Container from '@mui/material/Container';

const CustomInput = styled(Input)`
  border-radius: 4px;
  background-color: #FFFFFF;
  padding: 4px 4px 4px 8px;
  margin: 4px;
`;

export default function ContactForm(props) {

  return (
    <Container
      maxWidth="md"
    >
      <form action="https://getform.io/f/5e4237ae-3406-47ed-bc41-ee1b2876f978" method="POST">
        <Box
          sx={{
            disply: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            backgroundColor: "#eeeeee",
            padding: 4,
          }}>
          <Box>
            <InputLabel htmlfor="contac-name">お名前 (必須)</InputLabel>
          </Box>
          <Box
            sx={{ mb: 2 }}
          >
            <CustomInput
              id="contact-name"
              type="text"
              required
              fullWidth
              name="name" />
          </Box>
          <Box>
            <InputLabel htmlfor="contact-email">e-mail (必須)</InputLabel>
          </Box>
          <Box
            sx={{ mb: 2 }}
          >
            <CustomInput
              id="contact-email"
              type="text"
              required
              fullWidth
              name="email" />
          </Box>
          <Box>
            <InputLabel htmlfor="contact-message">お問い合わせ内容 (必須)</InputLabel>
          </Box>
          <Box
            sx={{ mb: 2 }}
          >
            <CustomInput
              id="contact-message"
              type="text"
              name="message"
              multiline
              required
              fullWidth
              minRows="5"
            />
          </Box>
          <Box>
            <Button
              type="submit"
              variant="contained">送信
            </Button>
          </Box>
        </Box>
      </form >
    </Container>
  )
}