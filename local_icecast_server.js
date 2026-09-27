import net from 'net';
import http from 'http';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8000;
const MOUNT = '/live';
const PASSWORD = 'hackme';

let activeSourceSocket = null;
const webListeners = new Set();
let cloudflareProc = null;
let publicHttpsStreamUrl = null;

// 32KB Circular Burst Buffer so connecting browsers get instant MP3 sync frames & play with 0 codec errors
const MAX_BURST_BYTES = 32768;
let burstBuffer = Buffer.alloc(0);

// Detect Local Network IPv4 (e.g. 192.168.x.x)
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}
const localIp = getLocalIp();

// Create raw TCP server handling both BUTT (SOURCE/PUT) and Web Browsers (GET)
const server = net.createServer((socket) => {
    socket.setNoDelay(true);

    let isSource = false;
    let isListener = false;
    let buffer = Buffer.alloc(0);
    let headersParsed = false;

    socket.on('data', (chunk) => {
        if (!headersParsed) {
            buffer = Buffer.concat([buffer, chunk]);
            const headerEndIndex = buffer.indexOf('\r\n\r\n');
            if (headerEndIndex === -1) return;

            const headerString = buffer.slice(0, headerEndIndex).toString('utf-8');
            const [requestLine, ...headers] = headerString.split('\r\n');
            const [method, requestPath] = (requestLine || '').split(' ');

            headersParsed = true;
            const remainingData = buffer.slice(headerEndIndex + 4);

            console.log(`[Stream Server] 📡 Incoming request: ${method} ${requestPath}`);

            // ── 1. BUTT Broadcast Source (SOURCE or PUT) ──
            if (method === 'SOURCE' || method === 'PUT') {
                isSource = true;
                socket.setNoDelay(true);
                console.log(`[Stream Server] 🎙️ BUTT Encoder CONNECTED (Studio Live)!`);

                if (activeSourceSocket && activeSourceSocket !== socket) {
                    try { activeSourceSocket.destroy(); } catch (e) {}
                }
                activeSourceSocket = socket;
                burstBuffer = Buffer.alloc(0); // Reset burst buffer for fresh stream

                // Send Icecast 200 OK handshake BUTT expects
                socket.write('HTTP/1.0 200 OK\r\n\r\n');
                console.log(`[Stream Server] 🔴 BROADCAST IS ON AIR!`);

                if (remainingData.length > 0) {
                    broadcastAudio(remainingData);
                }
                return;
            }

            // ── 2. Web Browser Listener or Control API (GET / HEAD / OPTIONS) ──
            if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
                const cleanPath = (requestPath || '/').split('?')[0];

                if (method === 'OPTIONS') {
                    socket.write(
                        'HTTP/1.1 200 OK\r\n' +
                        'Access-Control-Allow-Origin: *\r\n' +
                        'Access-Control-Allow-Methods: GET, HEAD, OPTIONS\r\n' +
                        'Access-Control-Allow-Headers: *\r\n\r\n'
                    );
                    socket.end();
                    return;
                }

                if (method === 'HEAD') {
                    if (cleanPath === '/live' || cleanPath === '/stream') {
                        socket.write(
                            'HTTP/1.1 200 OK\r\n' +
                            'Content-Type: audio/mpeg\r\n' +
                            'Access-Control-Allow-Origin: *\r\n' +
                            'Cache-Control: no-cache, no-store, must-revalidate, max-age=0\r\n' +
                            'Connection: keep-alive\r\n\r\n'
                        );
                        socket.end();
                        return;
                    }
                    if (cleanPath === '/status' || cleanPath === '/stats' || cleanPath === '/status-json.xsl') {
                        socket.write(
                            'HTTP/1.1 200 OK\r\n' +
                            'Content-Type: application/json\r\n' +
                            'Access-Control-Allow-Origin: *\r\n\r\n'
                        );
                        socket.end();
                        return;
                    }
                    socket.write('HTTP/1.0 404 Not Found\r\n\r\n');
                    socket.end();
                    return;
                }

                // Status & Metadata endpoint
                if (cleanPath === '/status' || cleanPath === '/stats' || cleanPath === '/status-json.xsl') {
                    const json = JSON.stringify({
                        status: activeSourceSocket ? 'ONLINE' : 'STANDBY',
                        mount: MOUNT,
                        listeners: webListeners.size,
                        localUrl: `http://localhost:${PORT}${MOUNT}`,
                        networkUrl: `http://${localIp}:${PORT}${MOUNT}`,
                        publicUrl: publicHttpsStreamUrl || `http://localhost:${PORT}${MOUNT}`,
                        publicHttpsUrl: publicHttpsStreamUrl || null
                    }, null, 2);
                    socket.write(
                        'HTTP/1.1 200 OK\r\n' +
                        'Content-Type: application/json\r\n' +
                        'Access-Control-Allow-Origin: *\r\n' +
                        `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n` +
                        json
                    );
                    socket.end();
                    return;
                }

                // Launch BUTT Studio API (called by web admin button)
                if (cleanPath === '/api/launch-studio' || cleanPath === '/api/launch-butt') {
                    launchButtStudio();
                    const json = JSON.stringify({
                        success: true,
                        serverStatus: activeSourceSocket ? 'ONLINE' : 'STANDBY',
                        streamUrl: `http://localhost:${PORT}${MOUNT}`,
                        lanStreamUrl: `http://${localIp}:${PORT}${MOUNT}`,
                        publicHttpsUrl: publicHttpsStreamUrl || null,
                        message: "BUTT studio launched successfully!"
                    });
                    socket.write(
                        'HTTP/1.1 200 OK\r\n' +
                        'Content-Type: application/json\r\n' +
                        'Access-Control-Allow-Origin: *\r\n' +
                        `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n` +
                        json
                    );
                    socket.end();
                    return;
                }

                // Streaming Audio Listener (/live or /stream)
                isListener = true;
                socket.setNoDelay(true);

                socket.write(
                    'HTTP/1.1 200 OK\r\n' +
                    'Content-Type: audio/mpeg\r\n' +
                    'Access-Control-Allow-Origin: *\r\n' +
                    'Cache-Control: no-cache, no-store, must-revalidate, max-age=0\r\n' +
                    'Pragma: no-cache\r\n' +
                    'Expires: 0\r\n' +
                    'X-Accel-Buffering: no\r\n' +
                    'Connection: keep-alive\r\n\r\n'
                );

                // Immediately send burst buffer so browser decodes audio instantly without codec errors
                if (burstBuffer.length > 0) {
                    try {
                        socket.write(burstBuffer);
                    } catch (e) {}
                }

                webListeners.add(socket);
                console.log(`[Stream Server] 🎧 Listener connected! Total active listeners: ${webListeners.size}`);
                return;
            }

            // Other unknown paths
            socket.write('HTTP/1.0 404 Not Found\r\n\r\n');
            socket.end();
        } else {
            // Stream audio chunks if source
            if (isSource) {
                broadcastAudio(chunk);
            }
        }
    });

    socket.on('close', () => {
        if (isSource) {
            console.log('[Stream Server] ⏹️ BUTT Encoder disconnected.');
            if (activeSourceSocket === socket) {
                activeSourceSocket = null;
            }
        }
        if (isListener) {
            webListeners.delete(socket);
            console.log(`[Stream Server] Listener disconnected. Total active: ${webListeners.size}`);
        }
    });

    socket.on('error', (err) => {
        if (isSource) {
            console.warn('[Stream Server] Source socket notice:', err.message);
            if (activeSourceSocket === socket) activeSourceSocket = null;
        } else {
            webListeners.delete(socket);
        }
    });
});

process.on('uncaughtException', (err) => {
    console.warn('[Stream Server] Caught unhandled exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.warn('[Stream Server] Caught unhandled rejection:', reason);
});

function broadcastAudio(chunk) {
    // Maintain rolling burst buffer
    burstBuffer = Buffer.concat([burstBuffer, chunk]);
    if (burstBuffer.length > MAX_BURST_BYTES) {
        burstBuffer = burstBuffer.slice(burstBuffer.length - MAX_BURST_BYTES);
    }

    for (const listener of webListeners) {
        try {
            listener.write(chunk);
        } catch (e) {
            webListeners.delete(listener);
        }
    }
}

function launchButtStudio() {
    const buttPath = path.join(process.env.LOCALAPPDATA || 'C:\\Users\\User\\AppData\\Local', 'butt', 'butt.exe');
    try {
        const child = spawn(buttPath, [], {
            detached: true,
            stdio: 'ignore',
            cwd: path.dirname(buttPath)
        });
        child.unref();
        console.log("[Stream Server] 🚀 BUTT Studio process triggered.");
    } catch (e) {
        console.warn("[Stream Server] Launch BUTT notice:", e.message);
    }
}

function copyToClipboard(text) {
    if (process.platform === 'win32') {
        try {
            const ps = spawn('powershell', [
                '-NoProfile',
                '-ExecutionPolicy', 'Bypass',
                '-Command', `Set-Clipboard -Value '${text}'`
            ]);
            ps.on('error', () => {});
        } catch (e) {}
    }
}

let isShuttingDown = false;

function startCloudflareTunnel() {
    if (isShuttingDown) return;
    const cloudflaredExe = path.join(__dirname, 'tools', 'cloudflared.exe');
    if (!fs.existsSync(cloudflaredExe)) {
        console.log(`[Stream Server] ℹ️ Cloudflare Tunnel binary not found at: ${cloudflaredExe}`);
        return;
    }

    console.log(`[Stream Server] 🔒 Launching Cloudflare Tunnel for secure HTTPS streaming...`);

    try {
        cloudflareProc = spawn(cloudflaredExe, ['tunnel', '--url', `http://127.0.0.1:${PORT}`], {
            stdio: ['ignore', 'pipe', 'pipe']
        });

        const handleTunnelOutput = (data) => {
            const text = data.toString();
            const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
            if (match && !publicHttpsStreamUrl) {
                publicHttpsStreamUrl = `${match[0]}${MOUNT}`;
                const urlFile = path.join(__dirname, 'tools', 'stream_url.txt');
                try { fs.writeFileSync(urlFile, publicHttpsStreamUrl, 'utf8'); } catch (e) {}

                copyToClipboard(publicHttpsStreamUrl);

                console.log(`\n========================================================`);
                console.log(`🔒 SECURE HTTPS STREAM ACTIVE (Netlify & Worldwide):`);
                console.log(`   ${publicHttpsStreamUrl}`);
                console.log(`📋 (COPIED TO YOUR CLIPBOARD!)`);
                console.log(`👉 Paste into Admin Console "Audio Stream URL" & Go Live!`);
                console.log(`========================================================\n`);
            }
        };

        cloudflareProc.stdout.on('data', handleTunnelOutput);
        cloudflareProc.stderr.on('data', handleTunnelOutput);

        cloudflareProc.on('close', (code) => {
            console.log(`[Stream Server] Cloudflare tunnel closed (code: ${code}).`);
            cloudflareProc = null;
            publicHttpsStreamUrl = null;
            if (!isShuttingDown) {
                console.log(`[Stream Server] 🔄 Re-establishing Cloudflare tunnel in 3 seconds...`);
                setTimeout(startCloudflareTunnel, 3000);
            }
        });

        cloudflareProc.on('error', (err) => {
            console.warn(`[Stream Server] Cloudflare tunnel notice:`, err.message);
        });
    } catch (e) {
        console.warn(`[Stream Server] Could not launch Cloudflare tunnel:`, e.message);
    }
}

function cleanup() {
    isShuttingDown = true;
    if (cloudflareProc) {
        try {
            if (process.platform === 'win32') {
                spawn('taskkill', ['/F', '/T', '/PID', cloudflareProc.pid]);
            } else {
                cloudflareProc.kill('SIGKILL');
            }
        } catch (e) {}
        cloudflareProc = null;
    }
}

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================================`);
    console.log(`📻 DCLM OSUN II — HIGH COMPATIBILITY STREAMING SERVER`);
    console.log(`========================================================`);
    console.log(`📡 Port:            ${PORT}`);
    console.log(`📍 Mount:           ${MOUNT}`);
    console.log(`🔗 Local Stream:    http://localhost:${PORT}${MOUNT}`);
    console.log(`🌐 Network Stream:  http://${localIp}:${PORT}${MOUNT}`);
    console.log(`========================================================\n`);

    startCloudflareTunnel();
});

