import React, { useCallback, useRef, useState } from 'react';
import API, { graphqlOperation } from '@aws-amplify/api';
import { Article } from '../../models';
import useAnalytics from '../../hooks/useAnalytics';
import ArticleList from './ArticleList';

const PopularArticlesQuery = `query PopularArticles($limit:Int, $nextToken:String) {
  popularArticles(limit:$limit, nextToken:$nextToken) {
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

const PopularArticles = () => {
  const [ isLoading, setIsLoading ] = useState(false);
  const [ articles, setArticles ] = useState<(Article)[]>([]);
  
  let nextToken = useRef<(string|null)>(null);
  let limit = 10;

  useAnalytics(() => {
    return {
        title: '[Popular Articles]'
      }
  });
  
  const loadMoreArticles = useCallback(() => {
    async function loadMore() {
      // if nextToken isn't set, we don't have more to load
      if (nextToken.current === "") { return; }
      
      setIsLoading(true);
      try {
        // @ts-ignore
        const { data: { popularArticles: { items:articles, nextToken:_token } } } =
          await API.graphql(graphqlOperation(PopularArticlesQuery, { limit, nextToken: nextToken.current }));
        // @ts-ignore
        setArticles(prevState => ([ ...prevState, ...articles ]));
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

export default PopularArticles;
