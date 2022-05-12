import React from "react";
import { GatsbyImage } from "gatsby-plugin-image";

import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';


export default function ArticleCard({ node }) {
  return (
    <Card>
      <CardContent >
        {node.image &&
          <GatsbyImage image={node.image} alt={node.title} />
        }
        <Typography gutterBottom variant="h5" component="div">
          {node.title}
        </Typography>
        <Typography>
          {node.update}
        </Typography>
      </CardContent>
      <CardActions>
        <Button >記事に移動</Button>
      </CardActions>
    </Card>
  )
}