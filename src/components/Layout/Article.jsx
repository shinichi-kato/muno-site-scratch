import React from "react";
import { graphql, Link } from "gatsby";
import { MDXProvider } from "@mdx-js/react";
import { MDXRenderer } from "gatsby-plugin-mdx";
import { GatsbyImage, getImage } from "gatsby-plugin-image";

import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Contents from './Contents';
import TopMenu from './TopMenu';
import Navigation from './Navigation';
import Footer from '../Footer';

import Monobot from '../Chatbot/Monobot';
import RetrieverDemo from '../Chatbot/RetrieverDemo';
import ArticleLink from './ArticleLink';

import "./mdx.css";

const components = {
  p: props => <Typography sx={{ pb: 2, lineHeight: "1.7rem" }} {...props} />,
  Chatbot: Monobot,
  RetrieverDemo: RetrieverDemo,
  code: props => <code className="mdx-code">{props.children}</code>,
  pre: props => <pre className="mdx-pre">{props.children}</pre>,
  blockquote: props => <blockquote className="mdx-blockquote">{props.children}</blockquote>,
  Link: Link,
  ArticleLink: ArticleLink,
};


export const pageQuery = graphql`
  query BlogPostQuery($id: String) {
    mdx(id: { eq: $id }) {
      body
      frontmatter {
        color
        featuredImage {
          childImageSharp {
            gatsbyImageData(layout: FULL_WIDTH, aspectRatio: 3)
          }
        }
        tags
        title
        updated(formatString: "YYYY-MM-DD")
      }
      slug
    }
  }
`


export default function PageTemplate({ data: { mdx }, pageContext }) {
  const frontmatter = mdx.frontmatter;
  const featuredImage = getImage(frontmatter.featuredImage);

  return (
    <Container
      maxWidth="lg"
      sx={{
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Box>
        <TopMenu />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row"
        }}
      >
        <Box
          sx={{
            display: { xs: "none", sm: "block" },
            width: "240px",
            p: 2,
          }}
        >
          <Contents currentSlug={mdx.slug} />
        </Box>
        <Box
          sx={{ flex: 1, p: 2 }}
        >
          <GatsbyImage
            image={featuredImage}
            alt={frontmatter.title}
            height={200}

          />
          <Typography variant="h2"
            sx={{ pt: 2 }}
          >{frontmatter.title}</Typography>
          <Typography
            sx={{ pb: 2 }}
          >{frontmatter.updated}</Typography>
          <MDXProvider components={components}>
            <MDXRenderer frontmatter={frontmatter}>{mdx.body}</MDXRenderer>
          </MDXProvider>
          <Navigation context={pageContext} />
        </Box>
      </Box>
      <Box>
        <Footer />
      </Box>
    </Container>
  )
}