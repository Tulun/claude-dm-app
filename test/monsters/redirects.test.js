import { describe, it, expect } from 'vitest';
import nextConfig from '../../next.config.mjs';

describe('monster library route rename', () => {
  it('redirects the old /templates URLs to /monsters (the API stays at /api/templates)', async () => {
    const redirects = await nextConfig.redirects();
    expect(redirects).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: '/templates', destination: '/monsters' }),
      expect.objectContaining({ source: '/templates/:id', destination: '/monsters/:id' }),
    ]));
    expect(redirects.some(r => r.source.startsWith('/api'))).toBe(false);
  });
});
