import "../styles/tailwind.css";
import { ApolloProvider } from "@apollo/client";
import apolloClient from "../lib/apollo";
import Layout from "../components/Layout";

function MyApp({ Component, pageProps }) {
  return (
    <ApolloProvider client={apolloClient}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ApolloProvider>
  );
}

export default MyApp;
