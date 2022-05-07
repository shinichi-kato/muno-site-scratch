import React, { useState } from 'react';
import { useStaticQuery, graphql, navigate, Link } from "gatsby";

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import Logo from '../logo.inline.svg';

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

export default function TopMenu() {
  const data = useStaticQuery(query);
  const menu = data.allMdx.nodes.map(node=>
    <MenuItem 
    onClick={()=>navigate(`/${node.slug}`)}
    key={node.slug}
    >
      {node.frontmatter.title}
    </MenuItem>
  );

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        p: 1,
        position: "relative"
      }}
    >
      <Box>
        <Link to="/">
        <Logo style={{ height: "2rem", width: "100%" }} />
        </Link>
        
      </Box>
      <Box
        sx={{
          position: "absolute",
          right: 1,
          top: 0,
        }}
      >
        <IconButton
          id="menu-button"
          aira-controls={open ? 'top-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
        >
          <MenuIcon />
        </IconButton>
        <Menu
          id="top-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          menuListProps={{
            'aria-labelledby': 'menu-button'
          }}
        >
          {menu}
        </Menu>
      </Box>
    </Box>
  )
}