import useSWR from 'swr';
import API, { graphqlOperation } from '@aws-amplify/api';
import { Sparklines, SparklinesLine } from 'react-sparklines';

const siteStatistics = /* GraphQL */ `
    query SiteStatistics {
      siteStatistics {
        total
        daily {
          date
          newPosts
        }
      }
    }
  `;

function Stats() {
  const fetcher = query => API.graphql(graphqlOperation(query))
                              .then(r => {
                                const { data: { siteStatistics } } = r;
                                return siteStatistics;
                              });

  const { data, error } = useSWR(siteStatistics, fetcher);

  if (error) {
    console.error(error);
    return <div></div>;
  }

  if (!data) return <div></div>

  const { daily, total } = data;
  const pts = daily.reduceRight((acc, curr) => {
    acc.push(curr.newPosts);
    return acc;
  }, [])

  console.log(pts)

  return (
    <div className="mt-2 mb-4">
      <p>
        Currently tracking <span className="mx-1 font-semibold">{ total }</span> articles,
        with <span className="mx-1 font-semibold">{ pts[pts.length - 1] }</span> new today.
      </p>

      <div className="h-8 w-60 my-4 inline-block">
        <Sparklines data={ pts } viewBoxHeight={ 40 } viewBoxWidth={ 100 }>
          <SparklinesLine color="blue" />
        </Sparklines>
      </div>
    </div>
  );
}

export default function Footer() {
  

  return (
    <>
      <footer className="flex-shrink-0 w-full mt-10 pt-8 bg-gray-100 text-gray-500 border-t border-gray-300">
        <div className="mx-auto  text-sm leading-lg text-center">
          <Stats />

          <p>&copy; 2019-2020. AWS News is for demonstrartion only.</p>
          <p>No claims are made on content presented here.</p>

          <img className="h-8 my-8 mx-auto" src="https://a0.awsstatic.com/libra-css/images/logos/aws_smile-header-desktop-en-white_59x35@2x.png" alt="AWS News" />
          <div className="h-12 bg-gray-100"></div>
        </div>
      </footer>
    </>
  );
};
