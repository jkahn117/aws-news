import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import UserCircleIcon from 'heroicons/solid/user-circle.svg';

dayjs.extend(relativeTime);

export function BlogSlug({ article }) {
  const { blog } = article;
  if (!blog) return "";

  return (
    <Link href="/blog/[id]" as={ `/blog/${blog.id}` }>
      <a className="leading-5 font-medium sm:text-indigo-800 sm:text-xs">
        { blog.title }
      </a>
    </Link>
  );
}

function FromNow({ date }) {
  return (
    <time datetime={ date }>
      { dayjs(date).fromNow() }
    </time>
  );
}

export function BlogSlugWithDate({ article }) {
  function isNew() {
    if (!article.publishedAt) { return false; }

    const threeDaysAgo = dayjs().subtract(3, 'days').startOf('day');
    return dayjs(article.publishedAt).isAfter(threeDaysAgo);
  }


  return (
    <>
      <div className="mb-1 text-xs leading-5 font-medium sm:text-indigo-800 sm:text-xs">
        { isNew() ? (
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
        <span><FromNow date={ article.publishedAt } /></span>
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
        <div><FromNow date={ article.publishedAt } /></div>
      </div>
    </div>
  );
}
