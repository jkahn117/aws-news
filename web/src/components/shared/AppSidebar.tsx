import React, { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

import { DataStore } from '@aws-amplify/datastore';
import { Blog } from '../../models';

interface BlogMenuItemProps {
  blog: Blog
};

const BlogMenuItem = ({ blog } : BlogMenuItemProps) => {
  return (
    <li>
      <NavLink
        to={ `/blog/${blog.id}` }
        activeClassName="is-active"
      >
        { blog.title }
      </NavLink>
    </li>
  );
};

const AppSidebar = () => {
  const [ blogs, setBlogs ] = useState<Blog[]>([]);

  const listBlogs = useCallback(() => {
    async function loadBlogs() {
      try {
        const _blogs:Blog[] = await DataStore.query(Blog);
        setBlogs(_blogs.sort((a, b) => (a.title < b.title) ? -1 : 1));
      } catch (error) {
        console.error(error);
      }
    }

    loadBlogs();
  }, []);

  useEffect(() => {
    listBlogs();
  }, [ listBlogs ]);

  useEffect(() => {
    const subscription = DataStore.observe(Blog).subscribe(msg => {
      listBlogs();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [ listBlogs ]);

  return (
    <aside className="menu">
      <figure className="image" style={{ marginTop: '1rem' }}>
        <NavLink to="/">
          <img src="/aws.png" alt="AWS News" className="has-image-centered" style={{ maxWidth: '150px' }} />
        </NavLink>
      </figure>
      <p className="menu-label">
        Blogs
      </p>
      <ul className="menu-list">
      { blogs.map((blog) =>
          <BlogMenuItem key={ blog.id } blog={ blog } />
        )}
      </ul>
    </aside>
  )
};

export default AppSidebar;
