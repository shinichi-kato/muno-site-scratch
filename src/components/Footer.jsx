import React from "react";
import { useStaticQuery, graphql, navigate} from "gatsby";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Crest from './crest.inline.svg';

const query = graphql`
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
`;

const subMenuItems = [
  {
    slug: 'sub/author',
    frontmatter:{
      title: 'About'
    }
  }
];

function generateMenuItems(items){
    return items.map(node=>
      <MenuItem
      onClick={() => navigate(`/${node.slug}`)}
      key={node.slug}
    >
      {node.frontmatter.title}
    </MenuItem>
  );
}


export default function Footer(){
  const data = useStaticQuery(query);
  const mainMenu = generateMenuItems(data.allMdx.nodes);
  const subMenu = generateMenuItems(subMenuItems);

  return(
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        px: 5,
        py: 2,
        m: 0,
        width: "100%",
        background: "linear-gradient(118deg, rgba(255,238,89,1) 0%, rgba(255,247,172,1) 100%);",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
        }}
      >
        <Box
          sx={{alignSelf: "center"}}
        >
        <Crest 
          style={{width: "100px", height: "100px"}}
        />
        </Box>
        <Box>
          <MenuList
            dense
          >
            {mainMenu}
          </MenuList>
        </Box>
        <Box>
          <MenuList
            dense
          >
            {subMenu}
          </MenuList>
  
        </Box>
      </Box>

      <Box>
        <Typography variant="caption">Copyright(c) 1999-2022, 人工無脳は考える</Typography>
      </Box>

    </Box>
  )
}