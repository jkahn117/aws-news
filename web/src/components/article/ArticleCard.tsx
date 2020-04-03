import React from 'react';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import { Header, Image, Placeholder } from 'semantic-ui-react';
import { Article } from '../../models';

interface ArticleCardProps {
  article: Article
  index: Number
  loading?: Boolean
}

const ArticleCard = ({ article, index, loading } : ArticleCardProps) => {
  return (
    <article>
      { loading ? (
        <LoadingArticleCard />
      ) : (
        <LoadedArticleCard article={ article } index={ index } />
      )}
    </article>
  );
};

const LoadedArticleCard = ({ article, index } : ArticleCardProps) => {
  return (
    <>
      <div className="img-wrapper">
        <Image src={ article.image } />
      </div>
      <Header as={ index === 0 ? 'h2' : 'h3' }>
        <Link to={ `/article/${article.id}` }>{ article.title }</Link>
      </Header>
      <Header sub>
        <Moment format="MMM DD YYYY" date={ article.publishedAt } />
      </Header>
      <p>{ article.excerpt }</p>
    </>
  )
}

const LoadingArticleCard = () => {
  return (
    <Placeholder fluid>
      <Placeholder.Header>
        <Placeholder.Image />
        <Placeholder.Line length="full" />
      </Placeholder.Header>
      <Placeholder.Paragraph>
        <Placeholder.Line length="long" />
        <Placeholder.Line length="medium" />
        <Placeholder.Line length="long" />
      </Placeholder.Paragraph>
    </Placeholder>
  );
};

export default ArticleCard;
