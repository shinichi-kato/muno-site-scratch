import * as React from 'react';

import Box from '@mui/material/Box';
import Top from '../components/Landing/Top';
import Book from '../components/Landing/Book';
import Updates from '../components/Landing/Updates';
import TopMenu from '../components/TopMenu';
import Footer from '../components/Footer';



export default function Index() {


  return (
    <Box
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
    </Box>
  );
}
