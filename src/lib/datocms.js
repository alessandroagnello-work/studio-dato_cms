import { executeQuery } from '@datocms/cda-client';

export const performRequest = (query, options = {}) => {
  return executeQuery(query, {
    ...options,
    token: process.env.NEXT_DATOCMS_API_TOKEN,
  });
};