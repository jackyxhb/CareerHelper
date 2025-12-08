import { useEffect, useState } from 'react';
import { Hub } from 'aws-amplify';

const defaultStatus = {
  networkActive: true,
  outboxEmpty: true,
  state: 'idle',
};

export default function useDataStoreSyncStatus() {
  const [status, setStatus] = useState(defaultStatus);

  useEffect(() => {
    const unsubscribe = Hub.listen('datastore', hubData => {
      const { event, data } = hubData.payload;

      setStatus(current => {
        switch (event) {
          case 'networkStatus':
            return { ...current, networkActive: data.active };
          case 'outboxStatus':
            return { ...current, outboxEmpty: data.isEmpty };
          case 'ready':
            return { ...current, state: 'ready' };
          case 'syncQueriesStarted':
            return { ...current, state: 'syncing' };
          case 'syncQueriesReady':
            return { ...current, state: 'steady' };
          default:
            return current;
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const bannerState = (() => {
    if (!status.networkActive) {
      return {
        type: 'warning',
        message: 'Offline mode: showing the latest synced data.',
      };
    }

    if (!status.outboxEmpty) {
      return {
        type: 'info',
        message: 'Uploading offline changes…',
      };
    }

    if (status.state === 'syncing') {
      return {
        type: 'info',
        message: 'Syncing with CareerHelper cloud…',
      };
    }

    return null;
  })();

  return {
    banner: bannerState,
    status,
  };
}
