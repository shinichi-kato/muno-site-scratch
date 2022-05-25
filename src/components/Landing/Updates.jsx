import React from 'react';
import { useStaticQuery, graphql } from "gatsby"
import { GatsbyImage, getImage } from "gatsby-plugin-image";

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import ListSubheader from '@mui/material/ListSubheader';
import IconButton from '@mui/material/IconButton';
import InfoIcon from '@mui/icons-material/Info';


const query = graphql`
  {
    allMdx(sort: {fields: frontmatter___updated, order: DESC}, limit: 10) {
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
      }
    }
  }
`;


function generateList(data) {
  return data.allMdx.nodes.map(node => {
    const f = node.frontmatter;
    return {
      title: f.title,
      tags: f.tags,
      updated: f.updated,
      image: f.featuredImage
    }
  });
}

export default function Updates(props) {
  const nodes = generateList(useStaticQuery(query));


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
        >
          {nodes.map((node, index) =>
            <ImageListItem key={index}>
              <GatsbyImage
                image={getImage(node.image)} alt={node.title}
              />
              <ImageListItemBar
                title={node.title}
                subtitle={node.updated}
              />
            </ImageListItem>)}
        </ImageList>
      </Box>
    </Box>
  )
}