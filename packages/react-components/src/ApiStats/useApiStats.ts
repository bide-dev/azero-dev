// Copyright 2017-2022 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Stats } from './types';

import { useCallback, useEffect, useRef, useState } from 'react';

import { createNamedHook, useApi } from '@polkadot/react-hooks';

const MAX_NUM = 100;
const INTERVAL = 5_000;

function useApiStatsImpl (): Stats[] {
  const { api, apiSystem, getStats } = useApi();
  const [stats, setStats] = useState<Stats[]>([]);
  const timerId = useRef<NodeJS.Timeout | null>(null);

  const fireTimer = useCallback(
    (): void => {
      timerId.current = null;

      const [stats, when] = getStats(api, apiSystem);

      setStats((prev): Stats[] => {
        if (prev.length === 0) {
          return [{ stats: { ...stats, max: { requests: stats.active.requests, subscriptions: stats.active.subscriptions } }, when }];
        }

        const last = prev[prev.length - 1].stats;
        const curr = {
          stats: {
            ...stats,
            max: {
              requests: Math.max(stats.active.requests, last.max.requests),
              subscriptions: Math.max(stats.active.subscriptions, last.max.subscriptions)
            }
          },
          when
        };

        return prev.length === MAX_NUM
          ? prev.concat(curr).slice(-MAX_NUM)
          : prev.concat(curr);
      });

      timerId.current = setTimeout(() => fireTimer(), INTERVAL);
    },
    [api, apiSystem, getStats, timerId]
  );

  useEffect((): () => void => {
    fireTimer();

    return (): void => {
      timerId.current && clearTimeout(timerId.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return stats;
}

export default createNamedHook('useApiStats', useApiStatsImpl);
