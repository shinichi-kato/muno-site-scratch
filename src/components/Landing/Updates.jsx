import React from 'react';
import { useStaticQuery, graphql, Link } from "gatsby"
import { GatsbyImage, getImage } from "gatsby-plugin-image";

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';


const query = graphql`
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
          updated(fromNow: true)
        }
        slug
      }
    }
  }
`;


function generateList(data, isWide) {
  const items = data.allMdx.nodes.map(node => {
    const f = node.frontmatter;
    return {
      title: f.title,
      tags: f.tags,
      updated: f.updated,
      image: f.featuredImage,
      slug: node.slug,
    }
  });

  return isWide ? items : items.slice(0, 8)
}

export default function Updates(props) {
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up('sm'));
  const nodes = generateList(useStaticQuery(query), isWide);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        m: 2,
        pu: 4,
      }}
    >
      <Box
        sx={{ pl: 4 }}
      >
        <Typography variant="h2">最新記事</Typography>
      </Box>
      <Box>
        <ImageList
          sx={{ width: "100%" }}
          gap={8}
          cols={isWide ? 3 : 2}
        >
          {nodes.map((node, index) =>
            <ImageListItem
              key={index}
            >
              <Link to={node.slug}>
                <GatsbyImage
                  image={getImage(node.image)} alt={node.title}
                  imgStyle={{ borderRadius: "0.5rem" }}
                />
                <ImageListItemBar
                  title={node.title}
                  subtitle={node.updated}
                  sx={{ borderRadius: "0 0 0.5rem 0.5rem" }}
                /></Link>

            </ImageListItem>)}
        </ImageList>
      </Box>
    </Box>
  )
}