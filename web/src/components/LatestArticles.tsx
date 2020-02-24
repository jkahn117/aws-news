import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';

import { Header, Item, List } from 'semantic-ui-react';

import { DataStore, Predicates } from '@aws-amplify/datastore';
import { Article } from '../models';

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
                "AWS Blog" }
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

const LatestArticles = () => {
  const [ articles, setArticles ] = useState<(Article)[]>([]);

  const latestArticles = useCallback(() => {
    async function loadArticles() {
      try {
        // @ts-ignore
        const _articles:Article[] = await DataStore.query(Article, Predicates.ALL, {
          limit: 20
        });
        setArticles(_articles.sort((a, b) => (a.publishedAt > b.publishedAt) ? -1 : 1));
      } catch (error) {
        console.error(error);
      }
    }

    loadArticles();
  }, []);

  useEffect(() => {
    latestArticles();
  }, [ latestArticles ]);

  useEffect(() => {
    const subscription = DataStore.observe(Article).subscribe(msg => {
      latestArticles();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [ latestArticles ]);

  return (
    <div>
      <section>
        <Header as="h1">Latest Articles</Header>
        <Item.Group>
          { articles.map((article, idx) => 
            <ArticleItem article={ article } key={ idx } />
          )}
        </Item.Group>
      </section>
    </div>
  );
};

export default LatestArticles;
