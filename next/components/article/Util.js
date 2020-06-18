import Link from 'next/link';
import moment from 'moment';
import Moment from 'react-moment';
import UserCircleIcon from 'heroicons/solid/user-circle.svg';

export function BlogSlug({ article }) {
  const { blog } = article;
  if (!blog) return "";

  

  return (
    <Link href="/blog/[blog.id]" as={ `/blog/${blog.id}` }>
      <a className="leading-5 font-medium sm:text-indigo-800 sm:text-xs">
        { blog.title }
      </a>
    </Link>
  );
}

export function BlogSlugWithDate({ article }) {
  function isNewThisWeek() {
    if (!article.publishedAt) { return false; }

    const startOfWeek = moment().subtract(7, 'days').startOf('day');
    return moment(article.publishedAt).isAfter(startOfWeek);
  }


  return (
    <>
      <div className="mb-1 text-xs leading-5 font-medium sm:text-indigo-800 sm:text-xs">
        { isNewThisWeek() ? (
          <span className="badge">NEW</span>
        ) : (
          <span/>
        )}

        { article.blog ? (
          <>
            <BlogSlug article={ article } />
            <span className="mx-2">&bull;</span>
          </>
        ) : (
          <span />
        )}
        <span><Moment fromNow>{ article.publishedAt }</Moment></span>
      </div>

      <style jsx>{`
          .badge {
            @apply mr-2 inline-block bg-teal-200 text-teal-800 text-xs px-2 rounded-full uppercase font-semibold tracking-wide;
          }
        `}
      </style>
    </>
  );
}

export function ByLine({ article }) {
  return (
    <div className="flex text-gray-500">
      <UserCircleIcon className="h-10 w-10 mr-2" />
      <div className="text-xs">
        <div>{ article.author }</div>
        <div><Moment fromNow>{ article.publishedAt }</Moment></div>
      </div>
    </div>
  );
}
