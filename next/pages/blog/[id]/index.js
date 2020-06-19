import Head from 'next/head';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import API, { graphqlOperation } from '@aws-amplify/api';
import Analytics from '@aws-amplify/analytics';

import Loader from '@/ui/Loader';
import PageHeader from '@/common/PageHeader';
import ArticleCard from '@/article/ArticleCard';

const getBlog = /* GraphQL */ `
    query GetBlog ($id: ID!) {
      getBlog(id: $id) {
        id
        title
        url
        articles(limit: 20, sortDirection: DESC) {
          items {
            id
            title
            image
            publishedAt
            excerpt
          }
        }
      }
    }
  `;

export default function Blog() {
  const { asPath, query: { id: blogId } } = useRouter();

  const fetcher = (query, id) => API.graphql(graphqlOperation(query, { id }))
                                            .then(r => {
                                              const { data: { getBlog } } = r;
                                              return getBlog;
                                            });

  const { data: blog, error } = useSWR(blogId ? [ getBlog, blogId ] : null, fetcher);

  if (error) {
    console.error(error);
    return <div>Failed to load</div>;
  }

  if (!blog) return <div><Loader /></div>

  Analytics.record({
    name: 'pageView',
    attributes: {
      path: asPath,
      title: `[Blog] ${blog.title}`,
      blogId: blog.id
    }
  });

  return (
    <>
      <Head>
        <title>{ blog.title } - AWS News</title>
      </Head>

      <section>
        <PageHeader title={ blog.title } />

        <div className="divide-y divide-gray-300 sm:px-8 sm:space-y-4">
          { blog.articles.items.map((article) =>
            <ArticleCard article={ article } key={ article.id } />
          )}
        </div>
      </section>
    </>
  );
}