import assert from 'node:assert/strict';
import { loadFunction } from './helpers/loadFunction.js';

describe('dedicated R2 upload endpoint', () => {
    it('always routes to R2 and disables accidental fallback to existing WebDAV', async () => {
        let calls = 0;
        const route = await loadFunction('functions/upload/r2.js', {
            onRequest: async (context) => {
                calls++;
                const url = new URL(context.request.url);
                assert.equal(url.searchParams.get('uploadChannel'), 'cfr2');
                assert.equal(url.searchParams.get('autoRetry'), 'false');
                assert.equal(url.searchParams.get('channelName'), null);
                assert.equal(url.searchParams.get('returnFormat'), 'full');
                assert.equal(url.searchParams.get('uploadFolder'), 'blog');
                assert.equal(context.request.method, 'POST');
                const form = await context.request.formData();
                assert.equal(form.get('file'), 'sample');
                assert.equal(context.env.marker, 'unchanged');
                return new Response(JSON.stringify({ ok: true }), { status: 200 });
            },
        });
        const form = new FormData();
        form.set('file', 'sample');
        const response = await route.onRequest({
            request: new Request('https://img.example/upload/r2?uploadChannel=webdav&autoRetry=true&channelName=Nutstore&returnFormat=full&uploadFolder=blog',
                { method: 'POST', body: form }),
            env: { marker: 'unchanged' },
        });
        assert.equal(response.status, 200);
        assert.equal(calls, 1);
    });

    it('rejects non-POST methods before invoking upload handler', async () => {
        let calls = 0;
        const route = await loadFunction('functions/upload/r2.js', {
            onRequest: async () => { calls++; return new Response('should-not-run'); },
        });
        for (const method of ['GET', 'DELETE']) {
            const result = await route.onRequest({
                request: new Request('https://img.example/upload/r2', { method }),
            });
            assert.equal(result.status, 405);
            assert.equal(result.headers.get('Allow'), 'POST');
        }
        assert.equal(calls, 0);
    });
});
