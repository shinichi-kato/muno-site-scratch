const path = require("path")
exports.createPages = async ({ graphql, actions, reporter }) => {
  // Destructure the createPage function from the actions object
  const { createPage } = actions
  const result = await graphql(`
    query {
      allMdx(sort: {fields: slug}, filter: {slug: {regex: "/^(?!drafts\\/)/"}}) {
        edges {
          node {
            id
            slug
          }
          next {
            slug
            frontmatter {
              title
            }
          }
          previous {
            frontmatter {
              title
            }
            slug
          }
        }
      }
    }
  `)
  if (result.errors) {
    reporter.panicOnBuild('🚨  ERROR: Loading "createPages" query')
  }
  // Create blog post pages.
  const posts = result.data.allMdx.edges
  // you'll call `createPage` for each result
  posts.forEach(({ node, next, previous }, index) => {
    createPage({
      // The slug generated by gatsby-plugin-mdx doesn't contain a slash at the beginning
      // You can prepend it with any prefix you want
      path: node.slug,
      // This component will wrap our MDX content
      component: path.resolve(`./src/components/Layout/Article.jsx`),
      // You can use the values in this context in
      // our page layout component
      context: { id: node.id, next, previous },
    })
  })
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions
  const typeDefs = `
    type Mdx implements Node {
      frontmatter: Frontmatter
    }
    type Frontmatter {
      title: String
      color: String
      updated: Date @dateformat
      featuredImage: File @fileByRelativePath
      tags: [String!]!
    }
  `
  createTypes(typeDefs)
}