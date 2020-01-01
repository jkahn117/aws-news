import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Showdown from 'showdown';

import { DataStore } from '@aws-amplify/datastore';
import Storage from '@aws-amplify/storage';
import { Article } from '../models';

interface ArticleContentProps {
  contentUri: string | undefined;
};

const ArticleContent = ({ contentUri } : ArticleContentProps) => {
  const [ content, setContent ] = useState();
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
    return { __html: converter.makeHtml(content) };
  }

  return (
    <div dangerouslySetInnerHTML={ makeHtmlFromContent() } />
  );
};

const ArticleView = () => {
  let { id } = useParams();
  const [ article, setArticle ] = useState<Article>();

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
    <div>
      { article ? (
        <section>
          <h2>{ article.title }</h2>
          <h3>by { article.author }</h3>
          <ArticleContent contentUri={ article.contentUri } />
        </section>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
};

export default ArticleView;
