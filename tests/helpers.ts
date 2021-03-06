import ApolloClient, { ApolloClientOptions } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink } from 'apollo-link';
import { withClientState } from 'apollo-link-state';
import { Next } from '../src/types';

export interface MockOptions {
  watchQuery?: (options: any) => any;
  readQuery?: (options: any, optimistic?: any) => any;
  writeQuery?: (options: any) => any;
  mutate?: (options: any) => any;
  subscribe?: (options: any) => any;
}

const noop = () => {};

export class MockClient<TCache> extends ApolloClient<TCache> {
  constructor(
    options: Partial<ApolloClientOptions<TCache>> & MockOptions = {}
  ) {
    const cache = options.cache || new InMemoryCache();
    const link =
      options.link ||
      ApolloLink.from([withClientState({ cache, resolvers: {} })]);

    const client_options: ApolloClientOptions<TCache> = Object.assign(options, {
      cache,
      link
    });

    super(client_options);

    const {
      watchQuery = noop,
      readQuery = noop,
      writeQuery = noop,
      mutate = noop,
      subscribe = noop
    } = options;

    this.watchQuery = jest.fn(watchQuery);
    this.readQuery = jest.fn(readQuery);
    this.writeQuery = jest.fn(writeQuery);
    this.mutate = jest.fn(mutate);
    this.subscribe = jest.fn(subscribe);
  }
}

export async function read<T>(store: any, take = 1, wait = 10): Promise<T[]> {
  const values: T[] = [];
  let push: Next<T> | undefined;

  const done = new Promise(resolve => {
    push = (value: T) => {
      values.push(value);
      if (values.length >= take) resolve();
    };
  });

  const unsubscribe = store.subscribe(push!);

  await Promise.race([done, timeout(wait)]);
  unsubscribe();

  return values.slice(0, take);
}

async function timeout(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
