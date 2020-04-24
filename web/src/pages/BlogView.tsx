import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import Moment from 'react-moment';

import './BlogView.scss';

import { DataStore } from '@aws-amplify/datastore';
import { Article, Blog } from '../models';
import useAnalytics from '../hooks/useAnalytics';

interface ArticleCardProps {
  article: Article
  index: Number
}

const ArticleCard = ({ article, index } : ArticleCardProps) => {
  return (
    <article>
      <div className="img-wrapper">
        <img src={ article.image } alt={ article.title } />
      </div>

      <h3 className={ `title ${ index === 0 ? 'is-3' : 'is-4' }` }>
        <Link to={ `/article/${article.id}` }>{ article.title }</Link>
      </h3>
      <h5 className={ `subtitle ${ index === 0 ? 'is-5' : 'is-6' }` }>
        <Moment format="MMM DD YYYY" date={ article.publishedAt } />
      </h5>
      <p>{ article.excerpt }</p>
    </article>
  );
};

const LoadingArticleCard = () => {
  return (
    <>
      <Skeleton height={ 200 } />
      <p style={{ paddingTop: '0.8rem' }}>
        <Skeleton height={ 30 } />
        <Skeleton height={ 20 } />
      </p>
      <p style={{ paddingTop: '0.5rem' }}>
        <Skeleton width='95%' />
        <Skeleton width='85%' />
        <Skeleton width='75%' />
        <Skeleton width='80%' />
      </p>
    </>
  );
};

const BlogView = () => {
  let { id: blogId } = useParams();

  const [ blog, setBlog ] = useState<Blog>();
  // a little funky? using another type to test if articles are loaded...using null was less pleasant
  // but still want to have something in the array to iterate over in order to create loading screen
  const [ articles, setArticles ] = useState<(Article|number)[]>([ 0, 1, 2, 3, 4, 5 ]);

  useAnalytics(() => {
    return blog ?
      {
        title: `[Blog] ${blog.title}`,
        blogId: blog.id
      } : {}
  }, [ blog ]);

  // using useCallback here per pattern at https://reactjs.org/docs/hooks-faq.html#is-it-safe-to-omit-functions-from-the-list-of-dependencies
  const setArticlesForBlog = useCallback(() => {
    async function loadArticles(id: string) {
      try {
        const _articles:Article[] = (await DataStore.query(Article)).filter(c => c.blog?.id === blogId);
        setArticles(_articles.sort((a, b) => (a.publishedAt > b.publishedAt) ? -1 : 1));
      } catch (error) {
        console.error(error);
      }
    }

    if (blogId) {
      loadArticles(blogId);
    }
  }, [ blogId ]);

  useEffect(() => {
    // define getBlog in useEffect, @see https://reactjs.org/docs/hooks-faq.html#is-it-safe-to-omit-functions-from-the-list-of-dependencies
    async function getBlog(id: string) {
      try {
        const _blog:Blog = await DataStore.query(Blog, id);
        setBlog(_blog);
      } catch (error) {
        console.error(error)
      }
    }

    if (blogId) {
      getBlog(blogId)
      setArticlesForBlog()
    }
  }, [ blogId, setArticlesForBlog ]);

  useEffect(() => {
    // Subscribe to updates to articles related to this blog...
    const subscription = DataStore.observe(Article).subscribe(msg => {
      // Mutation needs to include `blog { id }` in result. Reference here
      // as `.blogId` though.
      // @ts-ignore
      if (blogId && msg.element.blogId === blogId) {
        // console.log('**** ARTICLE SUBSCRIPTION ****');
        // console.log('  Operation type: ', msg.opType);
        // console.log('  Object: ', msg.element);
        setArticlesForBlog();
      }
    });

    return () => {
      subscription.unsubscribe();
      resetState();
    };
  }, [ blogId, setArticlesForBlog ]);

  function resetState() {
    setArticles([ 0, 1, 2, 3, 4, 5 ]);
    setBlog(undefined);
  }

  return (
    <section>
      <div className="hero">
        <div className="hero-body">
          { blog ? (
            <h1 className="title is-1">{ blog.title }</h1>
          ) : (
            <Skeleton height={50} />
          ) }
        </div>
      </div>
      <div className="frontpage-wrapper">
        <div className="frontpage">
          { articles.map((article, idx) =>
            <div className={ `fp-cell fp-cell--${idx+1}` } key={ idx }>
              { blog && typeof article === "object" ? (
                <ArticleCard article={ article } index={ idx } />
              ) : (
                <LoadingArticleCard/>                  
              ) }
              
            </div>
          )}
        </div>
      </div>
    </section>
  )
};

export default BlogView;
