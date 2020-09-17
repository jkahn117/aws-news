import Head from 'next/head';
import Link from 'next/link';
import { Amplify, Analytics, withSSRContext, graphqlOperation } from 'aws-amplify';

import PageHeader from '@/common/PageHeader';
import ArticleCard from '@/article/ArticleCard';
import Loader from '@/ui/Loader';

// for SSG
import awsconfig from '../aws-exports';
Amplify.configure({ ...awsconfig, ssr: true });
// for SSG

const latestArticles = /* GraphQL */ `
    query LatestArticles(
      $limit: Int,
      $nextToken: String
    ) {
      latestArticles(limit: $limit, nextToken: $nextToken) {
        items {
          id
          title
          image
          excerpt
          publishedAt
          blog {
            id
            title
          }
        }
        nextToken
      }
    }
  `;

/**
 * Use Next.js server-side generation to build pages upfront. Building on the
 * server saves runtime costs and reduces latency as they are generally slow moving.
 * 
 * @param {} context 
 */
export async function getStaticProps() {
  const { API } = withSSRContext();
  // load the blog data from the GraphQL endpoint
  const data = await API.graphql(graphqlOperation(latestArticles, { limit: 25 }))
                                .then(r => {
                                  const { data: { latestArticles } } = r;
                                  return latestArticles;
                                });

  return {
    props: {
      articles: data.items,
      nextToken: data.nextToken
    },
    revalidate: 900
  }
}

export default function Home({ articles }) {
  if (!articles) return <div><Loader /></div>

  Analytics.record({
    name: 'pageView',
    attributes: {
      path: '/',
      title: '[Home] Latest Articles'
    }
  });

  return (
    <>
      <Head>
        <title>AWS News</title>
      </Head>      

      <div className="hidden sm:block">
        <PageHeader title="Latest Articles"/>

        <div className="flex flex-row h-10 border-b border-gray-300 justify-center content-center text-sm">
          <div className="px-4 py m-2 inline">
            <span className="font-semibold mr-1">View:</span>
            <span className="divide-x space-x-1">
                <span className="selected pl-1">
                  Latest
                </span>
                <Link href="/popular">
                  <a className="pl-1">
                    Popular
                  </a>
                </Link>
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-300 sm:px-8 sm:space-y-4">
        { articles.filter(a => a).sort((a, b) => (a.publishedAt > b.publishedAt) ? -1 : 1).map((article) =>
          <ArticleCard article={ article } key={ article.id } />
        )}
      </div>

      <style jsx>{`
          button:focus {
            @apply outline-none;
          }

          .selected {
            @apply font-extrabold text-indigo-800;
          }
        `}
      </style>
    </>
  )
}
