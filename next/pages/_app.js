import Head from 'next/head';
import '../css/app.css';
import Navbar from '@/common/Navbar';
import Footer from '@/common/Footer';

// configure Amplify
import awsconfig from '../aws-exports';
import Amplify from '@aws-amplify/core';
import Analytics from '@aws-amplify/analytics';
import API, { graphqlOperation } from '@aws-amplify/api';
import { withSSRContext } from 'aws-amplify';
import Auth from '@aws-amplify/auth';

//Amplify.configure(awsconfig);
Amplify.configure({ ...awsconfig, ssr: true });

Analytics.autoTrack("session", {
  enable: true,
  type: "SPA"
});

// configure the content API separately ... for reasons unknown and to use a Next.js environment variable
API.configure({
  endpoints: [
    {
      name: 'content-api',
      endpoint: process.env.NEXT_PUBLIC_CONTENT_API,
      // custom_header: async () => {
      //   return { Authorization: `Bearer ${(await Auth.currentSession()).getAccessToken().getJwtToken()}` }
      // }
    }
  ]
});

const listBlogs = /* GraphQL */ `
    query ListBlogs (
      $limit: Int,
      $nextToken: String
    ) {
      listBlogs(limit: $limit, nextToken: $nextToken) {
        items {
          id
          title
        }
        nextToken
      }
    }
  `;

export default function MyApp({ Component, pageProps, blogs }) {
  return (
    <>
      <Head>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </Head>
      
      <div className="h-screen antialiased text-gray-900">
        <Navbar blogs={ blogs }/>

        <div className="bg-white sm:max-w-5xl sm:mx-auto">
          <main>
            <Component { ...pageProps } />
          </main>
        </div>

        <Footer />
      </div>
    </>
  );
}

MyApp.getInitialProps = async (context) => {
  const SSR = withSSRContext();
  const blogs = await SSR.API.graphql(graphqlOperation(listBlogs))
                            .then(r => {
                              const { data: { listBlogs: { items } }} = r;
                              return items;
                            });

  return {
    blogs
  }
}