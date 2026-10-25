/**
 * Explicit Cloudflare R2 upload entry point.
 *
 * Shares the original /upload handler, authorization, file index, quotas,
 * moderation and stable /file/:id links. This route never changes the
 * user's WebDAV/Nutstore channels or previously uploaded metadata.
 *
 * POST /upload/r2 (multipart/form-data: file)
 * Optional normal upload query flags: returnFormat=full, uploadFolder=...
 */
import { onRequest as upload } from './index.js';

export async function onRequest(context) {
    const { request } = context;
    // Do not turn GET/status requests into uploads.
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
            status: 405,
            headers: { Allow: 'POST' },
        });
    }

    const url = new URL(request.url);
    // This dedicated route MUST use the R2 channel even if the client
    // supplies uploadChannel=webdav/telegram or a stale default setting.
    url.searchParams.set('uploadChannel', 'cfr2');
    // Avoid silently sending a failed R2 upload to unrelated, configured
    // backends (especially the old WebDAV/Nutstore account).
    url.searchParams.set('autoRetry', 'false');
    url.searchParams.delete('channelName');

    const forwardedRequest = new Request(url.toString(), request);
    return upload({ ...context, request: forwardedRequest });
}
