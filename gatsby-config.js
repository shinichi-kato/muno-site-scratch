module.exports = {
  pathPrefix: "/~skato/muno",
  plugins: [
    'gatsby-plugin-react-helmet',
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: "人工無脳は考える - 雑談チャットボット研究＆考察サイト",
        short_name: "人工無脳は考える",
        start_url: "~skato/muno/",
        icons: [
          { src: "/src/images/app-icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/src/images/app-icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
        ]
      }
    },
    'gatsby-plugin-top-layout',
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-styled-components',
    'gatsby-plugin-mui-emotion',
    'gatsby-plugin-image',
    'gatsby-plugin-sharp',
    'gatsby-transformer-sharp',
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `content`,
        path: `${__dirname}/content/`,
        ignore: [`/drafts/*`]
      },
    },
    'gatsby-remark-images',
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        gatsbyRemarkPlugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 1035,
              sizeByPixelDensity: true,
              showCaptions: true,
            },
          },
        ],
      },
    },
    'gatsby-transformer-json',
    {
      resolve: 'gatsby-plugin-react-svg',
      options: {
        rule: {
          include: /\.inline\.svg$/
        }
      }
    }
  ],
  siteMetadata: {
    title: '人工無脳は考える',
    author: '加藤真一',
    description: '心をめぐる考察とチャットボットを作る技術',
    lang: 'ja',
    image: '',
  },
};
