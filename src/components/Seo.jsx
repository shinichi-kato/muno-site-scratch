import React from "react"
import { Helmet } from "react-helmet"
import { useLocation } from "@reach/router"
import { useStaticQuery, graphql } from "gatsby"

const query = graphql`
{
  site {
    siteMetadata {
      author
      description
      image
      lang
      title
    }
  }
}
`;

export default function Seo({title}){
  const {origin, pathname} = useLocation();
  const {site} = useStaticQuery(query);
  

  const m = site.siteMetadata
  const seo = {
    title: title ? `${m.title} - ${title}` : m.title,
    description: m.description || "",
    image: m.image,
    url: origin+pathname,
  };

  return (
    <Helmet title={seo.title}>
      <html lang={m.lang}/>
      <link rel="canonical" href={seo.url} />
      <meta name="description" content={seo.description} />
      <meta name="image" content={seo.image} />

      <meta property="og:url" content={seo.url} />
      <meta property="og:site_name" content={seo.title} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
    </Helmet>
  )

}