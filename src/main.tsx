import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthKitProvider, useAuth } from '@workos-inc/authkit-react';
import { ConvexReactClient } from 'convex/react';
import { RouterProvider } from '@tanstack/react-router';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { ConvexProviderWithAuthKit } from './ConvexProviderWithAuthKit';
import { ErrorBoundary } from './ErrorBoundary';
import { ParticlesProvider } from './components/ParticlesProvider';
import { router } from './router';
import './index.css';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
const workosApiHostname = import.meta.env.VITE_WORKOS_API_HOSTNAME
  ? import.meta.env.VITE_WORKOS_API_HOSTNAME.replace(/^https?:\/\//, '').replace(/\/$/, '')
  : undefined;
const hasCustomWorkosApiHostname =
  !!workosApiHostname && workosApiHostname !== 'api.workos.com';
// AuthKit cookie sessions require a same-site custom auth domain in production.
// Until VITE_WORKOS_API_HOSTNAME is set to a custom domain, keep the deployed
// prototype in devMode so refresh tokens are stored locally instead of relying
// on third-party cookies from api.workos.com (which browsers commonly block,
// causing authenticate 400s).
const workosDevMode =
  import.meta.env.VITE_WORKOS_DEV_MODE === 'true'
    ? true
    : import.meta.env.VITE_WORKOS_DEV_MODE === 'false'
      ? false
      : !hasCustomWorkosApiHostname;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthKitProvider
        clientId={import.meta.env.VITE_WORKOS_CLIENT_ID}
        redirectUri={import.meta.env.VITE_WORKOS_REDIRECT_URI}
        apiHostname={workosApiHostname}
        devMode={workosDevMode}
      >
        <ConvexProviderWithAuthKit client={convex} useAuth={useAuth}>
          <ParticlesProvider>
            <RouterProvider router={router} />
          </ParticlesProvider>
        </ConvexProviderWithAuthKit>
      </AuthKitProvider>
    </ErrorBoundary>
  </StrictMode>,
);
