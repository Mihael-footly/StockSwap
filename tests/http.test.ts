import { afterEach, describe, expect, it } from 'vitest';
import { limit } from '../src/server/http';

const originalUrl = process.env.SUPABASE_URL;
const originalSecret = process.env.SUPABASE_SECRET_KEY;
const originalLegacy = process.env.SUPABASE_SERVICE_ROLE_KEY;

afterEach(() => {
  if (originalUrl === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = originalUrl;
  if (originalSecret === undefined) delete process.env.SUPABASE_SECRET_KEY;
  else process.env.SUPABASE_SECRET_KEY = originalSecret;
  if (originalLegacy === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = originalLegacy;
});

describe('API rate limiting', () => {
  it('does not block read-only quotes before server storage is configured', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    await expect(limit(new Request('https://stockswap.local/v1/quotes', { method: 'POST' }))).resolves.toBeUndefined();
  });
});
