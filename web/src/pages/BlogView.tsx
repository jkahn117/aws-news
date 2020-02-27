import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Moment from 'react-moment';

import { Header, Image, Placeholder } from 'semantic-ui-react';
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
        <Image src={ article.image } />
      </div>
      <Header as={ index === 0 ? 'h2' : 'h3' }>
        <Link to={ `/article/${article.id}` }>{ article.title }</Link>
      </Header>
      <Header sub>
        <Moment format="MMM DD YYYY" date={ article.publishedAt } />
      </Header>
      <p>{ article.excerpt }</p>
    </article>
  );
};

const LoadingArticleCard = () => {
  return (
    <Placeholder fluid>
      <Placeholder.Header>
        <Placeholder.Image />
        <Placeholder.Line length="full" />
      </Placeholder.Header>
      <Placeholder.Paragraph>
        <Placeholder.Line length="long" />
        <Placeholder.Line length="medium" />
        <Placeholder.Line length="long" />
      </Placeholder.Paragraph>
    </Placeholder>
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
        id: blog.id
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
    <div>
      <section>
        { blog ? (
          <Header as="h1">{ blog.title }</Header>
        ) : (
          <Placeholder.Line length="long" />
        ) }
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
    </div>
  )
};

export default BlogView;
