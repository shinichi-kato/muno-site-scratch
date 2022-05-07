import * as React from 'react';

import Container from '@mui/material/Container';
import Top from '../components/Landing/Top';
import Book from '../components/Landing/Book';
import Updates from '../components/Landing/Updates';
import Navigation from '../components/Navigation';



export default function Index() {


  return (
    <Container

    >
      <Top />
      <Navigation />
      <Book />
      <Updates />
    </Container>
  );
}
