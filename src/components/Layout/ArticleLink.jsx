import React from "react";
import { graphql, useStaticQuery } from "gatsby";

import { Alert } from "@mui/material";
import ArticleCard from '../ArticleCard/ArticleCard';

const query = graphql`
  {
    allMdx(filter: {slug: {glob: "article/**"}}) {
      nodes {
        frontmatter {
          featuredImage {
            childImageSharp {
              gatsbyImageData
            }
          }
          color
          title
          tags
          updated(formatString: "YYYY-MM-DD")
        }
        slug
      }
    }
  }
`
export function generateMap(data) {
  let dict = {};
  for (let node of data.allMdx.nodes) {
    const f = node.frontmatter;
    dict[node.slug] = {
      title: f.title,
      tags: f.tags,
      updated: f.updated,
      featuredImage: f.featuredImage
    }
  }
  return dict;
}



export default function ArticleLink({ to }) {

  const map = generateMap(useStaticQuery(query));
  const slug = `article/${to}`;
  if (slug in map) {
    const node = map[slug];
    return (
      <ArticleCard
        node={node}
      />
    )
  }
  else {
    return (
      <Alert severity="error">
        {slug} が見つかりません
      </Alert>
    )
  }

}