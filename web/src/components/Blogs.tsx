import React, { useEffect, useState } from 'react';

import { DataStore } from '@aws-amplify/datastore';
import { Blog } from '../models';

interface BlogItemProps {
  blog: Blog
};

const BlogItem = ({ blog } : BlogItemProps) => {
  return (
    <li>{ blog.title }</li>
  );
};

interface BlogProps {
  limit?: number
};

const Blogs = ({ limit } : BlogProps) => {
  const [ blogs, setBlogs ] = useState<Blog[]>([]);

  useEffect(() => {
    listBlogs();
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

export default Blogs;
