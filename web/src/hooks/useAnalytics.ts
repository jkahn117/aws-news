import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Analytics from '@aws-amplify/analytics';

export default function useAnalytics (
  trackingData: object | (() => void),
  deps: Array<any> | void | null,
): void {
  let location = useLocation();
  let prevPath = useRef<string>("");
  let isReady = useRef<boolean>(false);

  const execute = useCallback(() => {
    async function recordPageView(attributes: object) {
      try {
        prevPath.current = location.pathname;
        await Analytics.record({ name: 'pageView', attributes });
        console.log(`[Analytics:pageView] ${JSON.stringify(attributes)}`);
      } catch(error) {
        console.error(`[ERROR - useAnalytics] ${error}`)
      }
    }

    // be careful to avoid calling record twice on same location (e.g. re-render)
    if (prevPath.current === location.pathname) {
      console.debug('[useAnalytics] Skipping as location has not changed...');
      return;
    }

    if (Array.isArray(deps)) {
      // test if any dependencies are null, if so, not ready
      isReady.current = !deps.some((item) => item == null);
    } else {
      isReady.current = true;
    }

    console.debug(`[useAnalytics] Dependencies ready: ${isReady.current}`)

    if (isReady.current) {
      let payload = typeof(trackingData) === 'function' ? trackingData() : trackingData;
      recordPageView({
        path: location.pathname,
        ...payload
      });
    }
  }, [ deps, trackingData, location, prevPath ]);

  useEffect(() => {
    execute();
  }, [ location, execute ]);
}