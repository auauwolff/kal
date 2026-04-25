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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthKitProvider
        clientId={import.meta.env.VITE_WORKOS_CLIENT_ID}
        redirectUri={import.meta.env.VITE_WORKOS_REDIRECT_URI}
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
