import Head from 'next/head';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import axios from 'axios';
import Markdown from 'react-markdown';

import API, { graphqlOperation } from '@aws-amplify/api';
import Storage from '@aws-amplify/storage';
import Analytics from '@aws-amplify/analytics';

import ArticleImage from '@/article/ArticleImage';
import { BlogSlug, ByLine } from '@/article/Util';
import Loader from '@/ui/Loader';

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
        blog {
          id
          title
        }
      }
    }
  `;

export default function Article() {
  const { asPath, query: { id: articleId } } = useRouter();

  const fetcher = (query, id) => API.graphql(graphqlOperation(query, { id }))
                                            .then(r => {
                                              const { data: { getArticle } } = r;
                                              return getArticle;
                                            });

  const fetchContent = id => API.get('content-api', `/content/${id}`, { responseType: 'text' })
                                .then(r => {
                                  return { __html: r };
                                });

  const { data: article, error } = useSWR(articleId ? [ getArticle, articleId ] : null, fetcher);
  
  const { data: content } = useSWR(articleId ? articleId : null, fetchContent);

  if (error) {
    console.error(error);
    return <div>Failed to load</div>;
  }

  if (!article) return <div><Loader /></div>

  Analytics.record({
    name: 'pageView',
    attributes: {
      path: asPath,
      title: `[Article] ${article.title}`,
      articleId: article.id,
      blogId: article.blog ? article.blog.id : null
    }
  });

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
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight leading-tight">
            { article.title }
          </h1>
          <ByLine article={ article } />

          <div className="content my-10 overflow-hidden">
            { content ? (
              // <Markdown source={ content } escapeHtml={ false } />
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