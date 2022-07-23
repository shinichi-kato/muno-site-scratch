import * as React from 'react';
import { graphql } from 'gatsby';
import Container from '@mui/material/Container';
import Top from '../components/Landing/Top';
import Book from '../components/Landing/Book';
import Updates from '../components/Landing/Updates';
import TopMenu from '../components/TopMenu';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

export const query = graphql`
  {
    allMdx(
      filter: {slug: {glob: "article/**"}}
      sort: {fields: frontmatter___updated, order: DESC}
      limit: 9
    ) {
      nodes {
        frontmatter {
          color
          featuredImage {
            childImageSharp {
              gatsbyImageData(layout: FULL_WIDTH, aspectRatio: 1)
            }
          }
          title
          tags
          updated
        }
        slug
      }
    }
  }
`;


export default function Index({data}) {


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
      <Updates data={data}/>
      <Footer />
      <Seo />
    </Container>
  );
}
