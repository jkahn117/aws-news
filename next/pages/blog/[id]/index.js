import Head from 'next/head';
import { useRouter } from 'next/router';
import { Amplify, Analytics, withSSRContext, graphqlOperation } from 'aws-amplify';

import Loader from '@/ui/Loader';
import PageHeader from '@/common/PageHeader';
import ArticleCard from '@/article/ArticleCard';

// for SSG
import awsconfig from '@/../aws-exports';
Amplify.configure({ ...awsconfig, ssr: true });
// for SSG

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

/**
 * Use Next.js server-side generation to build blog pages upfront. Building on the
 * server saves runtime costs and reduces latency as they are generally slow moving.
 * 
 * @param {} context 
 */
export async function getStaticProps(context) {
  const { API } = withSSRContext();
  const { params: { id } } = context;

  // load the blog data from the GraphQL endpoint
  const blog = await API.graphql(graphqlOperation(getBlog, { id }))
                        .then(r => {
                          const { data: { getBlog } } = r;
                          return getBlog;
                        });

  return {
    props: {
      blog
    },
    revalidate: 3600
  }
}

const listBlogs = /* GraphQL */ `
    query ListBlogs (
      $limit: Int,
      $nextToken: String
    ) {
      listBlogs(limit: $limit, nextToken: $nextToken) {
        items {
          id
        }
      }
    }
  `;

/**
 * When using Next.js server-side generation, we need to provide a list of paths
 * to be rendered at build time for dynamic paths. Next.js will statically render
 * the returned paths specified by this method. We will render all blogs.
 * 
 * If the article page was not pre-generated, fallback parameter instructs Next.js
 * to build when requested.
 */
export async function getStaticPaths() {
  const { API } = withSSRContext();
  const blogs = await API.graphql(graphqlOperation(listBlogs))
                          .then(r => {
                            const { data: { listBlogs: { items } }} = r;
                            return items;
                          });

  const blogParams = blogs.reduce((acc, blog) => {
    acc.push({ params: { id: blog.id } });
    return acc;
  }, []);
                      
  return {
    paths: blogParams,
    fallback: true
  }
}

export default function Blog({ blog }) {
  const { asPath } = useRouter();

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