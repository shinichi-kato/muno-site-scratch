import React from "react";
import { graphql } from "gatsby";
import { MDXProvider } from "@mdx-js/react";
import { MDXRenderer } from "gatsby-plugin-mdx";
import { Link } from "gatsby";

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Contents from './Contents';
import TopMenu from './TopMenu';
import Navigation from './Navigation';
import Footer from '../Footer';

import Monobot from '../Chatbot/Monobot';

import "./mdx.css";

const components = {
  p: props => <Typography sx={{ pb: 2, lineHeight: "1.6rem" }} {...props} />,
  Chatbot: Monobot,
  code: props => <code className="mdx-code">{props.children}</code>,
  pre: props => <pre className="mdx-pre">{props.children}</pre>,
  blockquote: props => <blockquote className="mdx-blockquote">{props.children}</blockquote>,
  Link: Link
};


export const pageQuery = graphql`
  query BlogPostQuery($id: String) {
    mdx(id: { eq: $id }) {
      body
      frontmatter {
        color
        featuredImage
        tags
        title
        updated(formatString: "YYYY-MM-DD")
      }
      slug
    }
  }
`


export default function PageTemplate({ data: { mdx }, pageContext }) {

  return (
    <Box
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
            p:2,
          }}
        >
          <Contents currentSlug={mdx.slug} />
        </Box>
        <Box
          sx={{flex:1, p:2}}
        >
          <Typography variant="h2">{mdx.frontmatter.title}</Typography>
          <Typography
            sx={{ pb: 2 }}
          >{mdx.frontmatter.updated}</Typography>
          <MDXProvider components={components}>
            <MDXRenderer frontmatter={mdx.frontmatter}>{mdx.body}</MDXRenderer>
          </MDXProvider>
          <Navigation context={pageContext} />
        </Box>
      </Box>
      <Box>
        <Footer />
      </Box>
    </Box>
  )
}