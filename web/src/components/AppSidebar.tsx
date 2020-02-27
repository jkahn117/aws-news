import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { Image, Menu } from 'semantic-ui-react';

import { DataStore } from '@aws-amplify/datastore';
import { Blog } from '../models';

interface BlogMenuItemProps {
  blog: Blog
};

const BlogMenuItem = ({ blog } : BlogMenuItemProps) => {
  let { pathname } = useLocation();

  return (
    <Menu.Item
      as={ Link }
      to={ `/blog/${blog.id}` }
      active={ pathname === `/blog/${blog.id}` }
    >
        { blog.title }
    </Menu.Item>
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
    <Menu
      as={ Menu }
      inverted
      vertical
      fixed="left"
    >
      <Menu.Item>
        <div style={{ width: '100%' }}>
          <Image
            src="/aws.png"
            size="tiny"
            style={{ display: 'block', margin: '0 auto' }}
            as={ Link }
            to="/" />
        </div>
      </Menu.Item>

      <Menu.Item>
        <Menu.Header>Blogs</Menu.Header>

        <Menu.Menu>
        { blogs.map((blog) =>
          <BlogMenuItem key={ blog.id } blog={ blog } />
        )}
        </Menu.Menu>
      </Menu.Item>
    </Menu>
  )
};

export default AppSidebar;
