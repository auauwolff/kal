import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { LoginRequiredError } from '@workos-inc/authkit-react';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';

type UseAuth = () => {
  isLoading: boolean;
  user: unknown;
  getAccessToken: (opts?: { forceRefresh?: boolean }) => Promise<string>;
};

type TokenStatus = 'signedOut' | 'checking' | 'ready' | 'missing';

const isExpectedMissingToken = (error: unknown) =>
  error instanceof LoginRequiredError ||
  (error instanceof Error && error.message === 'No access token available');

/**
 * A wrapper React component which provides a {@link ConvexReactClient}
 * authenticated with WorkOS AuthKit.
 *
 * It must be wrapped by a configured `AuthKitProvider`, from
 * `@workos-inc/authkit-react`.
 *
 * @public
 */
export function ConvexProviderWithAuthKit({
  children,
  client,
  useAuth,
}: {
  children: ReactNode;
  client: ConvexReactClient;
  useAuth: UseAuth;
}) {
  const useAuthFromWorkOS = useUseAuthFromAuthKit(useAuth);
  return (
    <ConvexProviderWithAuth client={client} useAuth={useAuthFromWorkOS}>
      {children}
    </ConvexProviderWithAuth>
  );
}

function useUseAuthFromAuthKit(useAuth: UseAuth) {
  return useMemo(
    () =>
      function useAuthFromWorkOS() {
        const { isLoading, user, getAccessToken } = useAuth();
        const [tokenStatus, setTokenStatus] = useState<TokenStatus>('checking');

        useEffect(() => {
          let cancelled = false;

          if (isLoading) {
            setTokenStatus('checking');
            return () => {
              cancelled = true;
            };
          }

          if (!user) {
            setTokenStatus('signedOut');
            return () => {
              cancelled = true;
            };
          }

          setTokenStatus('checking');
          void getAccessToken()
            .then((token) => {
              if (!cancelled) setTokenStatus(token ? 'ready' : 'missing');
            })
            .catch((error: unknown) => {
              if (!isExpectedMissingToken(error)) {
                console.warn('Could not refresh WorkOS access token:', error);
              }
              if (!cancelled) setTokenStatus('missing');
            });

          return () => {
            cancelled = true;
          };
        }, [getAccessToken, isLoading, user]);

        const fetchAccessToken = useCallback(
          async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
            if (!user) return null;

            try {
              return await getAccessToken({ forceRefresh: forceRefreshToken });
            } catch (error: unknown) {
              if (!isExpectedMissingToken(error)) {
                console.warn('Could not fetch WorkOS access token:', error);
              }
              return null;
            }
          },
          [getAccessToken, user],
        );

        return useMemo(
          () => ({
            isLoading: isLoading || (!!user && tokenStatus === 'checking'),
            isAuthenticated: !!user && tokenStatus === 'ready',
            fetchAccessToken,
          }),
          [fetchAccessToken, isLoading, tokenStatus, user],
        );
      },
    [useAuth],
  );
}
