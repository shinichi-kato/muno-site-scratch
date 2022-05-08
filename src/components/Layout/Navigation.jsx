import React from "react";

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { navigate } from "gatsby";

export default function Navigation(props) {
  const next = props.context.next;
  const previous = props.context.previous;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        p: 2,
      }}
    >
      <Box
        sx={{}}
      >
        {previous &&
          <Button
            color="inherit"
            startIcon={<ChevronLeftIcon/>}
            onClick={()=>navigate(`/${previous.slug}`)}
          >
            {previous.frontmatter.title}
          </Button>
        }
      </Box>
      <Box>
        {
          next &&
          <Button
            color="inherit"
            endIcon={<ChevronRightIcon/>}
            onClick={()=>navigate(`/${next.slug}`)}
          >
            {next.frontmatter.title}
          </Button>
        }
      </Box>
    </Box>
  )
}