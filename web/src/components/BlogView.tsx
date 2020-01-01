import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { DataStore } from '@aws-amplify/datastore';
import { Article, Blog } from '../models';

const BlogView = () => {
  let { id } = useParams();
  const [ blog, setBlog ] = useState<Blog>();
  const [ articles, setArticles ] = useState<Article[]>([]);

  useEffect(() => {
    if (id) {
      getBlog(id)
    }
  }, [ id ]);

  async function getBlog(blogId: string) {
    try {
      const _blog:Blog = await DataStore.query(Blog, blogId);
      setBlog(_blog);

      const _articles:Article[] = (await DataStore.query(Article)).filter(c => c.blog?.id === blogId);
      setArticles(_articles);
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div>
      { blog ? (
        <section>
          <h2>{ blog.title }</h2>
          <ul>
            { articles.map((article) => 
              <li key={ article.id }>
                <Link to={ `/article/${article.id}` }>{ article.title }</Link>
              </li>
            )}
          </ul>
        </section>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
};

export default BlogView;
