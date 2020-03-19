import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';

import { Header, Item, List, Loader, Visibility } from 'semantic-ui-react';

import API, { graphqlOperation } from '@aws-amplify/api';
import { Article } from '../models';
import useAnalytics from '../hooks/useAnalytics';

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

const LatestArticlesQuery = `query LatestArticles($limit:Int, $nextToken:String) {
  latestArticles(limit:$limit, nextToken:$nextToken) {
    items {
      id
      title
      blog {
        id
        title
      }
      image
      excerpt
      publishedAt
    }
    nextToken
  }
}`;

const LatestArticles = () => {
  const [ isLoading, setIsLoading ] = useState(false);
  const [ articles, setArticles ] = useState<(Article)[]>([]);
  
  let nextToken = useRef<(string|null)>(null);
  let limit = 10;

  useAnalytics(() => {
    return {
        title: '[Latest Articles]'
      }
  });
  
  const loadMoreArticles = useCallback(() => {
    async function loadMore() {
      setIsLoading(true);
      try {
        const { data: { latestArticles: { items:_articles, nextToken:_token } } } =
          await API.graphql(graphqlOperation(LatestArticlesQuery, { limit, nextToken: nextToken.current }));
        // @ts-ignore
        const newArticles = _articles.sort((a, b) => (a.publishedAt > b.publishedAt) ? -1 : 1);
        setArticles(prevState => ([ ...prevState, ...newArticles ]));
        nextToken.current = _token
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  
    loadMore();
  }, [ limit ]);

  useEffect(() => {
    loadMoreArticles();
  }, [ loadMoreArticles ])
  

  function onBottomVisible() {
    console.log("-- onBottomVisible --")
    if (isLoading) { return; }
    loadMoreArticles();
  }

  // useEffect(() => {
  //   const subscription = DataStore.observe(Article).subscribe(msg => {
  //     latestArticles();
  //   });

  //   return () => {
  //     subscription.unsubscribe();
  //   };
  // }, [ latestArticles ]);

  return (
    <div>
      <section>
        <Header as="h1">Latest Articles</Header>
        <Visibility
          onBottomVisible={ onBottomVisible }
          once={ false }
        >
          <Item.Group>
            { articles.map((article, idx) => 
              <ArticleItem article={ article } key={ idx } />
            )}
          </Item.Group>
          { isLoading &&
            <Loader active inline='centered'></Loader>
          }
        </Visibility>
      </section>
    </div>
  );
};

export default LatestArticles;
