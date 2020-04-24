import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import VisibilitySensor from 'react-visibility-sensor';

import Loader from '../shared/Loader';
import { Article } from '../../models';

interface ArticleItemProps {
  article: Article;
  onVisible(): void;
}

const ArticleItem = ({ article, onVisible } : ArticleItemProps) => {
  function onVisibilityChange(isVisible:boolean) {
    if (isVisible) {
      onVisible();
    }
  }

  return (
    <article className="media">
      <figure className="media-left is-hidden-mobile" style={{ marginLeft: '10px' }}>
        <p className="image is-5x4">
          <img style={{ maxWidth: '300px' }} src={ article.image } alt={ article.title } />
        </p>
      </figure>

      <VisibilitySensor onChange={ onVisibilityChange } partialVisibility>
        <article className="media-content">
          <div className="content">
            <h4 className="title is-4">
              <Link to={ `/article/${article.id}` }>{ article.title }</Link>
            </h4>
            <h5 className="subtitle is-6 has-text-weight-light	">
              <span><Moment format="MMM DD YYYY" date={ article.publishedAt } /></span>
              
              <span>
              { article.blog ?
                  <Link to={ `/blog/${article.blog.id}` }>{ article.blog.title }</Link> : "AWS Blog" }
              </span>
            </h5>
            <p>{ article.excerpt }</p>
          </div>
        </article>
      </VisibilitySensor>
    </article>
  );
};

interface ArticleListProps {
  articles: Article[]
  loading: Boolean
  loadMore: Function
}

const ArticleList = ({ articles, loading, loadMore } : ArticleListProps) => {
  useEffect(() => {
    loadMore();
  }, [ loadMore ])
  

  function onItemVisible(itemIndex:number) {
    if ((articles.length - 2) === itemIndex) {
      if (loading) { return; }
      console.log('... loading more ...');
      loadMore();
    }
  }

  return (
    <div style={{ paddingRight: '1.5em' }}>
      { articles.map((article, index) =>
          <ArticleItem article={ article }
                        key={ index }
                        onVisible={ () => onItemVisible(index) } />
      )}
      <div className="has-text-centered">
        { loading &&
            <Loader />
        }
      </div>
    </div>
  );
};

export default ArticleList;
