import React from "react";
import { graphql } from "gatsby";
import { MDXProvider } from "@mdx-js/react";
import { MDXRenderer } from "gatsby-plugin-mdx";
import { Link } from "gatsby";

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import Contents from './Contents';
import TopMenu from './TopMenu';


const shortcodes = { Link } // Provide common components here

export const pageQuery = graphql`
  query BlogPostQuery($id: String) {
    mdx(id: { eq: $id }) {
      body
      frontmatter {
        color
        featuredImage
        tags
        title
      }
      slug
    }
  }
`


export default function PageTemplate({ data: { mdx }, pageContext }) {
  console.log(pageContext);

  return (
    <Grid container>
      <Grid item xs={12}>
        <TopMenu />
      </Grid>
      <Grid container item xs={12}>
        <Grid item md={4} sx={{paddingTop:2}}>
          <Contents currentSlug={mdx.slug} />
        </Grid>
        <Grid item md={8} sx={{paddingTop:2}}>
          <Typography variant="h2">{mdx.frontmatter.title}</Typography>
          <MDXProvider components={shortcodes}>
            <MDXRenderer frontmatter={mdx.frontmatter}>{mdx.body}</MDXRenderer>
          </MDXProvider>
        </Grid>
      </Grid>
      <Grid>
        footer
      </Grid>
    </Grid>

  )
}