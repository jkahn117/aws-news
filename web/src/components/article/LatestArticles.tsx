import React, { useCallback, useRef, useState } from 'react';
import API, { graphqlOperation } from '@aws-amplify/api';
import { Article } from '../../models';
import useAnalytics from '../../hooks/useAnalytics';
import ArticleList from './ArticleList';

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
      // if nextToken isn't set, we don't have more to load
      if (nextToken.current === "") { return; }

      setIsLoading(true);
      try {
        // @ts-ignore
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

  return (
    <ArticleList articles={ articles } loadMore={ loadMoreArticles } loading={ isLoading } />
  );
};

export default LatestArticles;
