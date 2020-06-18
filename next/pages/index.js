import { useState } from 'react';
import Head from 'next/head';
import useSWR from 'swr';
import API, { graphqlOperation } from '@aws-amplify/api';
import Analytics from '@aws-amplify/analytics';

import PageHeader from '@/common/PageHeader';
import ArticleCard from '@/article/ArticleCard';
import Loader from '@/ui/Loader';

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

const popularArticles = /* GraphQL */ `
    query PopularArticles(
      $limit: Int,
      $nextToken: String
    ) {
      popularArticles(limit: $limit, nextToken: $nextToken) {
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

export default function Home() {
  const [ selectedView, setSelectedView ] = useState('latest');

  const fetcher = query => API.graphql(graphqlOperation(query, { limit: 25 }))
                              .then(r => {
                                const { data: { latestArticles: latest, popularArticles: popular } } = r;
                                return latest || popular;
                              });

  const { data, error } = useSWR(selectedView === 'latest' ? latestArticles : popularArticles, fetcher);

  if (error) {
    console.error(error);
    return <div>Failed to load</div>;
  }

  if (!data) return <div><Loader /></div>

  const { items, nextToken } = data;

  Analytics.record({
    name: 'pageView',
    attributes: {
      title: '[Home]'
    }
  });

  return (
    <>
      <Head>
        <title>AWS News</title>
      </Head>      

      <div className="hidden sm:block">
        <PageHeader title={ `${ selectedView } Articles` }/>

        <div className="flex flex-row h-10 border-b border-gray-300 justify-center content-center text-sm">
          <div className="px-4 py m-2 inline">
            <span className="font-semibold mr-1">View:</span>
            <span className="divide-x space-x-1">
                <button onClick={ () => setSelectedView('latest') }
                    className={ `${ selectedView === 'latest' ? 'selected' : '' } pl-1` }>
                  Latest
                </button>
                <button onClick={ () => setSelectedView('popular') }
                    className={ `${ selectedView === 'popular' ? 'selected' : '' } pl-1` }>
                  Popular
                </button>
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-300 sm:px-8 sm:space-y-4">
        { items.sort((a, b) => (a.publishedAt > b.publishedAt) ? -1 : 1).map((article) =>
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
