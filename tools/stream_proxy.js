/**
 * DCLM OSUN II - Stream Proxy
 * Sits between Cloudflare tunnel and Icecast.
 * Forwards /live as a true streaming pipe with correct headers
 * so Cloudflare does NOT buffer the audio response.
 */
import http from 'http';

const ICECAST_HOST = '127.0.0.1';
const ICECAST_PORT = 8000;
const PROXY_PORT = 8001;

const server = http.createServer((req, res) => {
    // CORS for browser audio players
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Accept, Icy-MetaData');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const reqPath = req.url.split('?')[0];
    if (reqPath !== '/live' && reqPath !== '/live/') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found. Use /live for the audio stream.');
        return;
    }

    // Forward request to Icecast
    const options = {
        hostname: ICECAST_HOST,
        port: ICECAST_PORT,
        path: '/live',
        method: 'GET',
        headers: {
            'Icy-MetaData': '0',
            'User-Agent': 'DCLM-StreamProxy/1.0',
            'bypass-tunnel-reminder': '1',   // Bypass Serveo/LocalTunnel interstitial
        }
    };

    // Enable TCP_NODELAY and keep-alive for uninterrupted streaming
    if (req.socket) {
        req.socket.setNoDelay(true);
        req.socket.setKeepAlive(true, 10000);
    }

    const proxyReq = http.request(options, (icecastRes) => {
        if (icecastRes.socket) {
            icecastRes.socket.setNoDelay(true);
            icecastRes.socket.setKeepAlive(true, 10000);
        }

        // If Icecast returned non-200 (e.g. 404 mount not active or 500 error), do NOT send audio/mpeg
        if (icecastRes.statusCode !== 200) {
            console.warn(`[Proxy] Icecast responded with status ${icecastRes.statusCode} for /live`);
            res.writeHead(503, {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, no-transform',
                'Retry-After': '3'
            });
            icecastRes.resume();
            res.end('Live audio stream not currently active or broadcasting.');
            return;
        }

        // Set critical headers to prevent any buffering by Cloudflare, proxies, or mobile operators
        res.writeHead(200, {
            'Content-Type': icecastRes.headers['content-type'] || 'audio/mpeg',
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, no-transform',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Accel-Buffering': 'no',
            'Transfer-Encoding': 'chunked',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'bypass-tunnel-reminder': '1',   // Bypass Serveo interstitial for browser audio
        });

        // Pipe audio bytes directly with Node stream backpressure handling
        icecastRes.pipe(res, { end: true });

        icecastRes.on('error', (err) => {
            console.warn('[Proxy] Icecast upstream stream error:', err.message);
            try { res.end(); } catch(e){}
        });
    });

    proxyReq.on('error', (err) => {
        console.error('[Proxy] Icecast connection error:', err.message);
        if (!res.headersSent) {
            res.writeHead(503, {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, no-transform'
            });
        }
        try { res.end('Stream temporarily unavailable'); } catch(e){}
    });

    // If client disconnects, cancel upstream request
    req.on('close', () => { try { proxyReq.destroy(); } catch(e){} });

    proxyReq.end();
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
    console.log(`[StreamProxy] Listening on http://127.0.0.1:${PROXY_PORT}/live`);
    console.log(`[StreamProxy] Forwarding to Icecast http://${ICECAST_HOST}:${ICECAST_PORT}/live`);
});

server.on('error', (err) => {
    console.error('[StreamProxy] Server error:', err.message);
    process.exit(1);
});
