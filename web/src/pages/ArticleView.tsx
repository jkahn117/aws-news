import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Showdown from 'showdown';
import Moment from 'react-moment';

import { Breadcrumb, Container, Header, Label } from 'semantic-ui-react';

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
    <div dangerouslySetInnerHTML={ makeHtmlFromContent() } />
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
    <div>
      { article ? (
        <Container text>
          <Breadcrumb>
            <Breadcrumb.Section link as={ Link } to={ `/blog/${article.blog?.id}` }>
              { article.blog?.title }
            </Breadcrumb.Section>
          </Breadcrumb>
          <Header as="h1">{ article.title }</Header>
          <Header sub>
            by { article.author } | <Moment format="MMM DD YYYY" date={ article.publishedAt } />
          </Header>

          <ArticleContent contentUri={ article.contentUri } />

          <div className="tags">
          { article.tags?.map((t, idx) =>
            <Label key={ idx }>{ t }</Label>
          )}
          </div>

          <p>
            <em>Originally published at: </em>
            <a href={ article.url } target="_new">{ article.url }</a>
          </p>
        </Container>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
};

export default ArticleView;
