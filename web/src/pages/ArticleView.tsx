import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import Showdown from 'showdown';
import Moment from 'react-moment';

import { DataStore } from '@aws-amplify/datastore';
import Storage from '@aws-amplify/storage';
import { Article } from '../models';
import useAnalytics from '../hooks/useAnalytics';

interface ArticleContentProps {
  contentUri: string | undefined;
};

const ArticleContent = ({ contentUri } : ArticleContentProps) => {
  const [ content, setContent ] = useState("");
  const converter = new Showdown.Converter();

  useEffect(() => {
    if (contentUri) {
      loadContent(contentUri);
    }
  }, [ contentUri ]);

  async function loadContent(uri:string) {
    // TODO: add track to automatically track downloads in Pinpoint
    let result = await Storage.get(uri, { download: true });
    // @ts-ignore
    setContent(result.Body.toString('utf8'));
  }

  function makeHtmlFromContent() {
    if (!content || 0 === content.length) {
      return { __html: "" }
    }
    return { __html: converter.makeHtml(content) };
  }

  return (
    <div className="content" dangerouslySetInnerHTML={ makeHtmlFromContent() } />
  );
};

interface ArticleLayoutProps {
  article: Article;
}

const ArticleLayout = ({ article } : ArticleLayoutProps) => {

  return (
    <article>
      <div className="hero">
        <div className="hero-body">
          { article ? (
            <>
              <nav className="breadcrumb" aria-label="breadcrumbs">
                <ul>
                  <li><Link to={ `/blog/${article.blog?.id}` }>{ article.blog?.title }</Link></li>
                </ul>
              </nav>
              <h1 className="title is-2">{ article.title }</h1>
              <h5 className="subtitle">
                <span>by { article.author }</span>
                <span><Moment format="MMM DD YYYY" date={ article.publishedAt } /></span>
              </h5>
            </>
          ) : (
            <>
              <Skeleton width={50} />
              <Skeleton height={50} />
            </>
          ) }
        </div>
      </div>

      <hr />
      
      <div className="container" style={{ padding: '0 3em 0 1.5em' }}>
        <ArticleContent contentUri={ article.contentUri } />

        <div className="tags" style={{ marginTop: '3em' }}>
          { article.tags?.map((t, idx) =>
            <span className="tag" key={ idx }>{ t }</span>
          )}
        </div>

        <p>
          <em>Originally published at: </em>
          <a href={ article.url } target="_new">{ article.url }</a>
        </p>
      </div>
    </article>
  );
};

const ArticleView = () => {
  let { id } = useParams();
  const [ article, setArticle ] = useState<Article>();

  useAnalytics(() => {
    return article ?
      {
        title: `[Article] ${article.title}`,
        articleId: article.id,
        blogId: article.blog ? article.blog.id : null
      } : {}
  }, [ article ]);

  useEffect(() => {
    if (id) {
      getArticle(id)
    }
  }, [ id ]);

  async function getArticle(articleId: string) {
    try {
      const _article:Article = await DataStore.query(Article, articleId);
      setArticle(_article);
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="container">
      { article ? (
        <ArticleLayout article= { article } />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
};

export default ArticleView;
