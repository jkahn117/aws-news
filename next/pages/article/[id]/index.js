import Head from 'next/head';
import { useRouter } from 'next/router';
import { Amplify, API, Analytics, withSSRContext, graphqlOperation } from 'aws-amplify';

import ArticleImage from '@/article/ArticleImage';
import { BlogSlug, ByLine } from '@/article/Util';
import Loader from '@/ui/Loader';
import Share from '@/ui/Share';

// for SSG
import awsconfig from '@/../aws-exports';
Amplify.configure({ ...awsconfig, ssr: true });

// configure the content API separately ... for reasons unknown and to use a Next.js environment variable
API.configure({
  endpoints: [
    {
      name: 'content-api',
      endpoint: process.env.NEXT_PUBLIC_CONTENT_API
    }
  ]
});
// for SSG

const getArticle = /* GraphQL */ `
    query GetArticle ($id: ID!) {
      getArticle(id: $id) {
        id
        title
        author
        image
        contentUri
        publishedAt
        url
        excerpt
        blog {
          id
          title
        }
      }
    }
  `;

/**
 * Use Next.js server-side generation to build article pages upfront. Articles
 * do not generally change after creation, so building on the server saves runtime
 * costs and reduces latency.
 * 
 * @param {} context 
 */
export async function getStaticProps(context) {
  const SSR = withSSRContext();
  const { params: { id } } = context;

  // load article data from the GraphQL endpoint
  const article = await SSR.API.graphql(graphqlOperation(getArticle, { id }))
                                .then(r => {
                                  const { data: { getArticle } } = r;
                                  return getArticle;
                                });

  // load the actual article content from the content API
  const content = await API.get('content-api', `/content/${id}`, { responseType: 'text' })
                          .then(r => {
                            return { __html: r };
                          });

  return {
    props: {
      article,
      content,
    }
  }
}

const latestArticles = /* GraphQL */ `
    query LatestArticles(
      $limit: Int,
      $nextToken: String
    ) {
      latestArticles(limit: $limit, nextToken: $nextToken) {
        items {
          id
        }
      }
    }
  `;

/**
 * When using Next.js server-side generation, we need to provide a list of paths
 * to be rendered at build time for dynamic paths. Next.js will statically render
 * the returned paths specified by this method. Will use latest articles for this
 * purpose, but only need the article IDs back.
 * 
 * If the article page was not pre-generated, fallback parameter instructs Next.js
 * to build when requested.
 */
export async function getStaticPaths() {
  const { API } = withSSRContext();
  const articles = await API.graphql(graphqlOperation(latestArticles))
                            .then(r => {
                              const { data: { latestArticles: { items } }} = r;
                              return items;
                            });

  const articleParams = articles.reduce((acc, article) => {
    acc.push({ params: { id: article.id } });
    return acc;
  }, []);
                      
  return {
    paths: articleParams,
    fallback: true
  }
}

export default function Article({ article, content }) {
  const { asPath, isFallback } = useRouter();

  if (!article) return <div><Loader /></div>

  // Analytics.record({
  //   name: 'pageView',
  //   attributes: {
  //     path: asPath,
  //     title: `[Article] ${article.title}`,
  //     articleId: article.id,
  //     blogId: article.blog ? article.blog.id : null
  //   }
  // });

  if (isFallback) return <div><Loader /></div>

  return (
    <>
      <Head>
        <title>{ article.title } - AWS News</title>
      </Head>

      <article className="relative">
        <ArticleImage className="w-full object-cover mb-4"
          article={ article }
          imageSizes={[ 480, 800, 1024]}
          sizes="(max-width: 480px) 100vw, (max-width: 800px) 800px, 1024px" />

        <div className="px-4">
          <BlogSlug article={ article } />
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight leading-tight lg:text-5xl">
            { article.title }
          </h1>

          <div className="flex flex-row flex-wrap justify-between">
            <ByLine article={ article } />
            
            <Share url={ article.url } title={ article.title } text={ article.excerpt } />
          </div>

          <div className="prose lg:prose-xl mx-auto my-10 overflow-hidden">
            { content ? (
              <div dangerouslySetInnerHTML={ content } />
            ) : (
              <Loader />
            ) }
            
          </div>

          <div className="text-sm text-gray-500">
            <p>Article originally published at: <a href={ article.url }>{ article.url }</a></p>
          </div>
        </div>
      </article>
    </>
  );
}