import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Moment from 'react-moment';

import { Header, Image } from 'semantic-ui-react';
import './BlogView.scss';

import { DataStore } from '@aws-amplify/datastore';
import { Article, Blog } from '../models';

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

const BlogView = () => {
  let { id: blogId } = useParams();
  const [ blog, setBlog ] = useState<Blog>();
  const [ articles, setArticles ] = useState<Article[]>([]);

  useEffect(() => {
    if (blogId) {
      getBlog(blogId)
    }
  }, [ blogId ]);

  useEffect(() => {
    // Subscribe to updates to articles related to this blog...
    const subscription = DataStore.observe(Article).subscribe(msg => {
      
      // TODO: msg.element.blogId is coming as null, so the update does not occur
      //   unclear why as blogId is included in the response payload for mutation
      console.log(msg.element);
      // @ts-ignore
      console.log(msg.element.blogId)
      console.log(blogId)

      // @ts-ignore
      if (blogId && msg.element.blogId === blogId) {
        console.log('**** ARTICLE SUBSCRIPTION ****');
        console.log('  Operation type: ', msg.opType);
        console.log('  Object: ', msg.element);
        setArticlesForBlog(blogId);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [ blogId ]);

  async function getBlog(id: string) {
    try {
      const _blog:Blog = await DataStore.query(Blog, id);
      setBlog(_blog);
      setArticlesForBlog(_blog.id);
    } catch (error) {
      console.error(error)
    }
  }

  async function setArticlesForBlog(id: string) {
    try {
      const _articles:Article[] = (await DataStore.query(Article)).filter(c => c.blog?.id === blogId);
      setArticles(_articles.sort((a, b) => (a.publishedAt > b.publishedAt) ? -1 : 1));
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div>
      { blog ? (
        <section>
          <Header as="h1">{ blog.title }</Header>
          <div className="frontpage-wrapper">
            <div className="frontpage">
              { articles.map((article, idx) =>
                <div className={ `fp-cell fp-cell--${idx+1}` } key={ article.id }>
                  <ArticleCard article={ article } index={ idx } />
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
};

export default BlogView;
