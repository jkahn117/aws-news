import Head from 'next/head';

import '../css/app.css';

import Navbar from '@/common/Navbar';
import Footer from '@/common/Footer';

// configure Amplify
import awsconfig from '../aws-exports';
import Amplify from '@aws-amplify/core';
import Analytics from '@aws-amplify/analytics';
Amplify.configure(awsconfig);

Analytics.autoTrack("session", {
  enable: true,
  type: "SPA"
});

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </Head>
      
      <div className="h-screen antialiased text-gray-900">
        <Navbar />

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