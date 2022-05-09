import * as React from 'react';
import { useStaticQuery, graphql, navigate } from "gatsby"

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

export const query = graphql`
  {
    allMdx(
      filter: {slug: {glob: "(article/*/|*)"}}
      sort: {fields: frontmatter___displayOrder}
    ) {
      nodes {
        slug
        frontmatter {
          title
        }
      }
    }
  }
`


export default function TopMenu(props) {
  const data = useStaticQuery(query);
  const contents = data.allMdx.nodes.map(node => ({
    title: node.frontmatter.title,
    slug: node.slug
  }));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        p: 1
      }}
    >
      {contents.map(node =>
        <Box
          key={node.title}
        >
          <Button
            color="inherit"
            onClick={()=>navigate(node.slug)}
          >
            {node.title}
          </Button>
        </Box>
      )}
     </Box>
  )
}