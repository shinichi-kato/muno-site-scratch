import React, { useMemo } from "react";
import { graphql, navigate, useStaticQuery } from "gatsby";

import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';



const query = graphql`
{
  allMdx(sort: {fields: slug}, filter: {slug: {glob: "article/**"}}) {
    nodes {
      slug
      frontmatter {
        title
        color
      }
    }
  }
}
`
const RE_PARENT = /(.*\/).+$/;
const RE_ARTICLE_SLUG = /^article\/[^/]+/;

function generateMenu(data, currentSlug) {
  /* graphqlのクエリ結果dataを解析し、currentSlugが属する
  ディレクトリの目次を生成する。
    see: https://stackoverflow.com/questions/18017869/build-tree-array-from-flat-array-in-javascript

  dataに含まれるnodesでは
  slugが'/'で終わっているものはindex.mdxで、ディレクトリ内で
  必ず先頭に現れ、childrenが存在することを示す。
  slugが'/'以外で終わっているものはそれ以上childがない末端である。
 これを以下のようなツリー形式に変換する。

  tree = [
    {
      title: "",
      slug: "",
      color: ""
      children: [
        {
          title: "",
          slug: "",
          color: "",
        }
    ]
    }, ...
  ]

  */

  let m = RE_ARTICLE_SLUG.exec(currentSlug);
  let root = m ? m[0] : null;

  let nodes = data.allMdx.nodes
    .filter(node => node.slug.startsWith(root))
    .map(node => ({
      title: node.frontmatter.title,
      color: node.frontmatter.color,
      slug: node.slug,
      children: [],
    }));

  let map = {}, node, roots = [], i;

  for (i = 0; i < nodes.length; i += 1) {
    map[nodes[i].slug] = i;
  }

  for (i = 0; i < nodes.length; i += 1) {
    node = nodes[i];
    if (!node.slug.endsWith('/')) {
      m = RE_PARENT.exec(node.slug);
      nodes[map[m[1]]].children.push(node);
    }
    else {
      roots.push(node);
    }
  }

  return roots;
}

function getColor(node){
  switch (node.color) {
    case 'primary':
      return 'primary.main';
    case 'secondary':
      return 'secondary.main';
    default:
      return node.color;
  }
}

function renderTree(nodes, currentSlug) {
  return (
    nodes.map(node =>
      <TreeItem
        nodeId={node.slug}
        label={
          <Typography
            sx={{
              fontWeight: currentSlug === node.slug ? "bold" : "normal",
              fontSize: "0.9rem",
              color: currentSlug === node.slug ? getColor(node) : "inherit", 
            }}
          >
            {node.title}
          </Typography>
        }
        key={node.slug}
      >
        {
          node.children.length !== 0
          &&
          renderTree(node.children, currentSlug)
        }
      </TreeItem>)
  )
}

export default function Contents({ currentSlug }) {
  const data = useStaticQuery(query);
  const memorizedMenu = useMemo(
    () => generateMenu(data, currentSlug)
    , [data, currentSlug]);

  const defaultExpanded = data.allMdx.nodes
    .filter(node => currentSlug.startsWith(node.slug))
    .map(node => node.slug);

  function handleNodeSelect(event, nodeId) {
    navigate(`/${nodeId}`);
  }

  return (
    <Box
    >
      <Typography
        variant="subtitle2"
        sx={{pl: "2rem"}}>contents</Typography>
      <TreeView
        aria-label="site-contents"
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        defaultExpanded={defaultExpanded}
        onNodeSelect={handleNodeSelect}
        sx={{
          overflowY: 'auto'
        }}
      >
        {renderTree(memorizedMenu, currentSlug)}
      </TreeView>
    </Box>

  )
}
