import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import { Item, List, Loader, Visibility } from 'semantic-ui-react';
import { Article } from '../../models';

interface ArticleItemProps {
  article: Article
}

const ArticleItem = ({ article } : ArticleItemProps) => {
  return (
    <Item>
      <Item.Image size="medium" src={ article.image } />

      <Item.Content>
        <Item.Header as={ Link } to={ `/article/${article.id}` }>
          { article.title }
        </Item.Header>
        <Item.Meta>
          <List horizontal bulleted>
            <List.Item>
              { article.blog ?
                <Link to={ `/blog/${article.blog.id}` }>{ article.blog.title }</Link>
                :
                "AWS Blog"
              }
            </List.Item>
            <List.Item>
              <Moment format="MMM DD YYYY" date={ article.publishedAt } />
            </List.Item>
          </List>
        </Item.Meta>
        <Item.Description>
          { article.excerpt }
        </Item.Description>
        <Item.Meta>
          <Link to={ `/article/${article.id}` }>Read more...</Link>
        </Item.Meta>
      </Item.Content>
    </Item>
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
  

  function onBottomVisible() {
    console.log("-- onBottomVisible --")
    if (loading) { return; }
    loadMore();
  }

  return (
    <Visibility
      onBottomVisible={ onBottomVisible }
      once={ false }
    >
      <Item.Group>
        { articles.map((article, index) => 
          <ArticleItem article={ article } key={ index } />
        )}
      </Item.Group>
      { loading &&
        <Loader active inline='centered'></Loader>
      }
    </Visibility>
  );
};

export default ArticleList;
