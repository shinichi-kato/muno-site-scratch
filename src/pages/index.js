import * as React from 'react';

import Container from '@mui/material/Container';
import Top from '../components/Landing/Top';
import Book from '../components/Landing/Book';
import Updates from '../components/Landing/Updates';
import TopMenu from '../components/TopMenu';
import Footer from '../components/Footer';
import Seo from '../components/Seo';


export default function Index() {


  return (
    <Container
      maxWidth="lg"
      disableGutters
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch"
      }}
    >
      <Top />
      <TopMenu />
      <Book />
      <Updates />
      <Footer />
      <Seo />
    </Container>
  );
}
