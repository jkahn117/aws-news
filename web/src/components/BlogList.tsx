import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { DataStore } from '@aws-amplify/datastore';
import { Blog } from '../models';

interface BlogItemProps {
  blog: Blog
};

const BlogItem = ({ blog } : BlogItemProps) => {
  return (
    <li><Link to={ `/blog/${blog.id}` }>{ blog.title }</Link></li>
  );
};

interface BlogListProps {
  limit?: number
};

const BlogList = ({ limit } : BlogListProps) => {
  const [ blogs, setBlogs ] = useState<Blog[]>([]);

  useEffect(() => {
    listBlogs();
  }, []);

  useEffect(() => {
    const subscription = DataStore.observe(Blog).subscribe(msg => {
      console.log('**** BLOG SUBSCRIPTION ****');
      console.log(msg.model, msg.opType, msg.element);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function listBlogs() {
    try {
      const items:Blog[] = await DataStore.query(Blog);
      console.log(items)
      setBlogs(items);
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div>
      <ul>
        { blogs.map((b) => 
          <BlogItem blog={ b } key={ b.id } />
        ) }
      </ul>
    </div>
  )
};

export default BlogList;
