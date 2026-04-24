import { Component, ReactNode } from 'react';
import { Alert, AlertTitle, Box, Link, Stack, Typography } from '@mui/material';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: ReactNode | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: unknown) {
    const errorText = '' + (error as Error).toString();
    if (
      errorText.includes('@workos-inc/authkit-react') &&
      errorText.includes('clientId')
    ) {
      return {
        error: (
          <Stack sx={{ gap: 1.5 }}>
            <Typography>
              Add the following environment variables to your <code>.env.local</code>:
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <li>
                <code>VITE_WORKOS_CLIENT_ID="your-client-id"</code>
              </li>
              <li>
                <code>VITE_WORKOS_API_HOSTNAME="api.workos.com"</code>
              </li>
              <li>
                <code>VITE_WORKOS_REDIRECT_URI="your-redirect-uri"</code>
              </li>
            </Box>
            <Typography>
              Find them in the{' '}
              <Link href="https://dashboard.workos.com" target="_blank" rel="noreferrer">
                WorkOS dashboard
              </Link>
              .
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
              Raw error: {errorText}
            </Typography>
          </Stack>
        ),
      };
    }
    return { error: <Typography>{errorText}</Typography> };
  }

  componentDidCatch() {}

  render() {
    if (this.state.error !== null) {
      return (
        <Box sx={{ p: 3, maxWidth: 720, mx: 'auto' }}>
          <Alert severity="error" variant="outlined">
            <AlertTitle>Caught an error while rendering</AlertTitle>
            {this.state.error}
          </Alert>
        </Box>
      );
    }
    return this.props.children;
  }
}
