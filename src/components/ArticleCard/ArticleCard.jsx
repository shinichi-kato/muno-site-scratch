import React from "react";
import { GatsbyImage, getImage } from "gatsby-plugin-image";

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';


export default function ArticleCard({ node }) {
  let color;
  switch(node.color){
    case 'primary':
      color="primary.main";
      break;
    case 'secondary':
      color="secondary.main";
      break;
    default:
      color="grey.500";
  }
  
  return (
    <Card
      sx={{ m: 1 }}
    >
      <CardContent >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row"
          }}
        >
          <Box
            sx={{
              width: "50vw",
              pr: 1,
            }}
          >
            {node.image &&
              <GatsbyImage
                image={getImage(node.image)} alt={node.title}
              />
            }
          </Box>
          <Box
            sx={{ flex: 1 }}
          >
            <Typography
              gutterBottom
              variant="h5"
              component="div"
              sx={{
                borderBottom: `solid 4px ${color}`,
              }}
            >
              {node.title}
            </Typography>
            <Typography>
              {node.updated}
            </Typography>
          </Box>

        </Box>
      </CardContent>
      <CardActions>
        <Button >記事に移動</Button>
      </CardActions>
    </Card>
  )
}