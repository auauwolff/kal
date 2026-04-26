import { AuthConfig } from 'convex/server';

const clientId = process.env.WORKOS_CLIENT_ID;
const apiHostname = (process.env.WORKOS_API_HOSTNAME ?? 'api.workos.com')
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');
const issuerOrigin = `https://${apiHostname}`;
const jwks = `${issuerOrigin}/sso/jwks/${clientId}`;

export default {
  providers: [
    {
      type: 'customJwt',
      issuer: `${issuerOrigin}/`,
      algorithm: 'RS256',
      jwks,
      applicationID: clientId,
    },
    {
      type: 'customJwt',
      issuer: `${issuerOrigin}/user_management/${clientId}`,
      algorithm: 'RS256',
      jwks,
    },
  ],
} satisfies AuthConfig;
