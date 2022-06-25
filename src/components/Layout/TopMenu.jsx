import React, { useState } from 'react';
import { useStaticQuery, graphql, navigate, Link } from "gatsby";
import { styled } from '@mui/material/styles';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowIcon from '@mui/icons-material/ArrowForwardIos';
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

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));


export default function TopMenu(props) {
  const data = useStaticQuery(query);
  const menu = data.allMdx.nodes.map(node =>
    <MenuItem
      onClick={() => navigate(`/${node.slug}`)}
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
    > <Box
      sx={{
        position: "absolute",
        left: 1,
        top:4,
        display: {xs: "block", sm: "none"},
      }}>
        <ExpandMore
          onClick={props.handleToggle}
          expand={props.openContents}
          aria-expanded={props.openContents? 'true' : undefined}
          aria-label="show more"
        >
          <ArrowIcon/>
        </ExpandMore>
    </Box>
      <Box>
        <Link to="/"
          style={{ textDecoration: "none" }}
        >
          <Logo style={{ height: "2rem", width: "100%" }} />
        </Link>

      </Box>
      <Box
        sx={{
          position: "absolute",
          right: 1,
          top: 4,
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