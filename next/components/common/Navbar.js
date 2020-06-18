import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import API, { graphqlOperation } from '@aws-amplify/api';

import ChevronDownIcon from 'heroicons/solid/chevron-down.svg';
import MenuIcon from 'heroicons/solid/menu.svg';
import UserIcon from 'heroicons/outline/user.svg';
import XIcon from 'heroicons/solid/x.svg';

import Dropdown, { DropdownContext } from '@/ui/Dropdown';

const listBlogs = /* GraphQL */ `
    query ListBlogs (
      $limit: Int,
      $nextToken: String
    ) {
      listBlogs(limit: $limit, nextToken: $nextToken) {
        items {
          id
          title
        }
        nextToken
      }
    }
  `;

function BlogListDropdown({ toggle }) {
  const fetcher = query => API.graphql(graphqlOperation(query))
                              .then(r => {
                                const { data: { listBlogs: items } } = r;
                                return items;
                              });

  const { data, error } = useSWR(listBlogs, fetcher);

  if (error) {
    console.error(error);
    return <div>Failed to load</div>;
  }

  if (!data) return <div></div>

  const { items, nextToken } = data;

  return (
    <>
      { items.sort((a, b) => (a.title < b.title) ? -1 : 1).map((blog) =>
        <Link href="/blog/[id]" as={ `/blog/${blog.id}` } key={ blog.id }>
          <a role="menuitem"
              onClick={ toggle }
              className="block px-4 py-2 text-sm leading-5 text-gray-100 sm:text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition duration-150 ease-in-out">
            { blog.title }
          </a>
        </Link>
      )}
    </>
  );
}

export default function NavBar() {
  const [ menuOpen, setMenuOpen ] = useState(false);

  const toggleMobileMenu = () => setMenuOpen(oldIsOpen => !oldIsOpen);

  return (
    <nav className="bg-gray-800">
      <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:bg-gray-700 focus:text-white transition duration-150 ease-in-out"
                    aria-label="Main menu" aria-expanded="false">
              { menuOpen ? (
                <XIcon className="blog h-6 w-6" onClick={ () => setMenuOpen(false) } />
              ) : (
                <MenuIcon className="blog h-6 w-6" onClick={ () => setMenuOpen(true) } />
              )}
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            {/* Logo */}
            <div className="flex-shrink-0 mt-1">
              <Link href="/">
                <a><img className="h-8 w-auto" src="https://a0.awsstatic.com/libra-css/images/logos/aws_smile-header-desktop-en-white_59x35@2x.png" alt="AWS News" /></a>
              </Link>
            </div>

            {/* Main menu - shown on small+, not on mobile */}
            <div className="hidden sm:block sm:ml-10">
              <div className="flex">
                <div className="relative">
                  <Dropdown>
                    <Dropdown.Button>
                      <button
                          className="px-3 py-2 rounded-md text-sm font-medium leading-5 text-white bg-gray-800 focus:outline-none focus:text-white focus:bg-gray-700 transition duration-150 ease-in-out">
                        <span>Blogs</span>
                        <ChevronDownIcon className="w-6 h-6 inline-flex" />
                      </button>
                    </Dropdown.Button>
                    <Dropdown.Menu>
                      <div className="origin-top-left absolute left-2 mt-2 w-64 rounded-md shadow-lg z-50">
                        <div className="py-1 rounded-md bg-white shadow-xs" role="menu" aria-orientation="vertical" aria-labelledby="uer-menu">
                          <DropdownContext.Consumer>
                            {({ toggle }) => <BlogListDropdown toggle={ toggle } /> }
                          </DropdownContext.Consumer>
                        </div>
                      </div>
                    </Dropdown.Menu>
                  </Dropdown> 
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <button className="p-1 border-2 border-transparent text-gray-400 rounded-full hover:text-white focus:outline-none focus:text-white focus:bg-gray-700 transition duration-150 ease-in-out"
                    aria-label="">
              <UserIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={ `${ menuOpen ? 'block' : 'hidden' } sm:hidden` }>
        <div className="px-2 pt-2 pb-3">
          <BlogListDropdown toggle={ toggleMobileMenu } />
        </div>
      </div>
    </nav>
  );
}
