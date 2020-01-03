import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { Menu } from 'semantic-ui-react';

import { DataStore } from '@aws-amplify/datastore';
import { Blog } from '../models';

interface BlogMenuItemProps {
  blog: Blog
};

const BlogMenuItem = ({ blog } : BlogMenuItemProps) => {
  let { pathname } = useLocation();

  // TODO: add LABEL to include count?
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

  useEffect(() => {
    listBlogs();
  }, []);

  async function listBlogs() {
    try {
      const items:Blog[] = await DataStore.query(Blog);
      setBlogs(items);
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Menu
      as={ Menu }
      inverted
      vertical
      fixed="left"
    >
      <Menu.Item as="h1">AWS News</Menu.Item>

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
