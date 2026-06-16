import createClient from 'openapi-fetch';
/**
 * Type-safe REST client for the OmniVerse Vision backend.
 */
export const client = createClient({
    baseUrl: 'http://localhost:8000',
});
