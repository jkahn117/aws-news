import Link from 'next/link';

import Image from '@/ui/Image';
import { BlogSlugWithDate } from './Util';

export default function ArticleCard({ article }) {
  return (
    <>
      <article className="relative pb-2/3 sm:flex sm:pb-0 sm:min-h-64">
        <div className="overflow-hidden sm:relative sm:max-w-sm sm:w-2/3 sm:py-4">
          <Image className="absolute h-full w-full object-cover"
            src={ article.image }
            alt={ article.title } />
        </div>
        <div className="absolute top-0 bg-gray-800 opacity-75 w-full h-full sm:hidden">
          {/* Nothing here */}
        </div>
        
        <div className="absolute bottom-0 px-4 py-4 text-white sm:text-gray-800 sm:relative sm:max-w-xl sm:px-12">
          <div className="hidden sm:block"><BlogSlugWithDate article={ article } /></div>
          <Link href="/article/[id]" as={ `/article/${article.id}` }>
            <a className="text-xl font-extrabold mb-2 tracking-tight leading-tight block sm:text-2xl">
              { article.title }
            </a>
          </Link>
          <div className="sm:hidden"><BlogSlugWithDate article={ article } /></div>
          <div className="hidden sm:block"></div>
          
          <div className="hidden text-sm font-light leading-6 text-gray-500 sm:block fade">
            { article.excerpt }
          </div>

          <Link href="/article/[id]" as={ `/article/${article.id}` }>
            <a className="hidden mt-2 text-blue-500 text-sm sm:block">
              Read More...
            </a>
          </Link>
        </div>
      </article>

      <style jsx>{`
        .badge {
          @apply inline-block bg-teal-200 text-teal-800 text-xs px-2 rounded-full uppercase font-semibold tracking-wide;
        }

        .fade {
          position: relative;
          height: 4.9em;
          overflow-y: hidden;
        }

        .fade:after {
          content: "";
          text-align: right;
          position: absolute;
          bottom: 0;
          right: 0;
          width: 70%;
          height: 1.5em;
          background: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1) 80%);
        }
      `}</style>
    </>
  );
};
