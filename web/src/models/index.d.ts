import { ModelInit, MutableModel, PersistentModelConstructor } from "@aws-amplify/datastore";



export declare class Blog {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly lastImportAt?: string;
  readonly articles?: Article[];
  constructor(init: ModelInit<Blog>);
  static copyOf(source: Blog, mutator: (draft: MutableModel<Blog>) => MutableModel<Blog> | void): Blog;
}

export declare class Article {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly image?: string;
  readonly published: boolean;
  readonly publishedAt: string;
  readonly author?: string;
  readonly contentUri?: string;
  readonly excerpt?: string;
  readonly tags?: string[];
  readonly blog?: Blog;
  constructor(init: ModelInit<Article>);
  static copyOf(source: Article, mutator: (draft: MutableModel<Article>) => MutableModel<Article> | void): Article;
}