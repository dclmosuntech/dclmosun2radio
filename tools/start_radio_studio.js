import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const projectDir = path.resolve('.');
const SUPABASE_URL = 'https://qksslhnlyjwnieiilcsf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrc3NsaG5seWp3bmllaWlsY3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MDU4MTEsImV4cCI6MjEwNjA4MTgxMX0.OSQP98iLjBkt4a3sNMFyMMpB67Kn2ySSv0_1OBfUtNM';

console.log('\n============================================================');
echo('      DCLM OSUN II -- LIVE RADIO STUDIO LAUNCHER           ');
console.log('============================================================\n');

function echo(msg) { console.log(msg); }

// Ensure BUTT broadcaster is configured for high-efficiency 64 kbps mono broadcast
try {
    const buttrcPath = path.join(process.env.APPDATA || '', 'buttrc');
    if (fs.existsSync(buttrcPath)) {
        let conf = fs.readFileSync(buttrcPath, 'utf8');
        if (/bitrate\s*=\s*(?:128|192|256|320)/.test(conf)) {
            conf = conf.replace(/bitrate\s*=\s*(?:128|192|256|320)/g, 'bitrate = 64');
            fs.writeFileSync(buttrcPath, conf, 'utf8');
            echo('✔ [Audio Engine] Optimized BUTT encoder bitrate to 64 kbps Mono for resilient streaming.');
        }
    }
} catch (e) {
    // Non-fatal
}

// 1. Check & Start Icecast
try {
    const taskList = execSync('tasklist /FI "IMAGENAME eq icecast.exe"', { encoding: 'utf8' });
    if (taskList.includes('icecast.exe')) {
        echo('✔ [1/4] Icecast Streaming Server is already running.');
    } else {
        echo('🚀 [1/4] Starting Icecast Streaming Server (Port 8000)...');
        const icecastXml = path.join(projectDir, 'tools', 'icecast.xml');
        spawn('cmd.exe', ['/c', 'start', '/min', 'Icecast Server', 'C:\\Program Files\\Icecast\\bin\\icecast.exe', '-c', icecastXml], {
            detached: true,
            stdio: 'ignore'
        });
        // Give Icecast a moment to bind port
        execSync('ping 127.0.0.1 -n 3 > NUL', { shell: 'cmd.exe' });
    }
} catch (e) {
    echo('⚠️ [1/4] Icecast start check notice: ' + e.message);
}

// 2. Check & Start BUTT
try {
    const taskList = execSync('tasklist /FI "IMAGENAME eq butt.exe"', { encoding: 'utf8' });
    if (taskList.includes('butt.exe')) {
        echo('✔ [2/4] BUTT Broadcaster is already running.');
    } else {
        echo('🚀 [2/4] Starting BUTT Broadcaster...');
        const buttPath = 'C:\\Users\\User\\AppData\\Local\\butt\\butt.exe';
        if (fs.existsSync(buttPath)) {
            spawn(buttPath, [], { detached: true, stdio: 'ignore' });
        } else {
            echo('⚠️ BUTT executable not found at AppData path. Please start BUTT manually if needed.');
        }
    }
} catch (e) {
    echo('⚠️ [2/4] BUTT start check notice: ' + e.message);
}

// 3a. Start Node.js Stream Proxy (port 8001)
// This bridges the SSH tunnel → Icecast with correct no-buffer streaming headers
echo('🔗 [3/4] Starting Stream Proxy (Port 8001)...');
const proxyProcess = spawn(process.execPath, ['tools/stream_proxy.js'], {
    cwd: projectDir,
    stdio: ['ignore', 'pipe', 'pipe']
});
proxyProcess.stdout.on('data', d => process.stdout.write(d));
proxyProcess.stderr.on('data', d => process.stderr.write(d));

// 3b. Use SSH → localhost.run for a real TCP streaming tunnel (no HTTP buffering, no OpenDNS blocks)
echo('📡 [3/4] Establishing Secure SSH Streaming Tunnel...');

const tunnel = spawn('ssh', [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=30',
    '-o', 'ExitOnForwardFailure=yes',
    '-o', 'ConnectTimeout=15',
    '-R', '80:127.0.0.1:8001',
    'nokey@localhost.run'
], {
    stdio: ['ignore', 'pipe', 'pipe']
});

let capturedUrl = null;

async function autoPublishToSupabase(fullStreamUrl) {
    try {
        echo('📡 Auto-publishing live stream URL to Supabase database...');
        
        await fetch(`${SUPABASE_URL}/rest/v1/app_settings`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                key: 'live_audio',
                value: {
                    title: 'DCLM OSUN II LIVE SANCTUARY BROADCAST',
                    isLive: true,
                    speaker: 'PASTOR W.F. KUMUYI / SANCTUARY FEED',
                    audioUrl: fullStreamUrl,
                    updatedBy: 'Radio Studio Auto-Launcher',
                    lastUpdated: new Date().toISOString(),
                    announcement: 'DCLM Osun II Live Sanctuary Feed'
                },
                last_updated: new Date().toISOString()
            })
        });

        await fetch(`${supabaseUrl}/rest/v1/app_settings`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                key: 'radio_broadcast',
                value: {
                    title: 'DCLM OSUN II LIVE SANCTUARY BROADCAST',
                    speaker: 'PASTOR W.F. KUMUYI / SANCTUARY FEED',
                    audioUrl: fullStreamUrl,
                    duration: 999999,
                    startedAt: Date.now(),
                    activeTrackId: 'live'
                },
                last_updated: new Date().toISOString()
            })
        });

        echo('✅ LIVE STREAM URL AUTOMATICALLY SYNCED TO ALL CONNECTED DEVICES!');
    } catch(err) {
        echo('⚠️ Auto-publish notice: ' + err.message);
    }
}

function parseTunnelOutput(chunk) {
    const text = chunk.toString();
    process.stdout.write(text); // Show raw output for debugging

    // localhost.run outputs: ... tunneled with tls termination, https://xxxxx.lhr.life
    const match = text.match(/(https:\/\/[a-z0-9]+\.lhr\.life)/i);
    if (match && !capturedUrl) {
        capturedUrl = match[1];
        const fullStreamUrl = `${capturedUrl}/live`;

        echo('\n============================================================');
        echo(' 🎉 STREAMING TUNNEL ESTABLISHED SUCCESSFULLY!');
        echo('============================================================');
        echo(`\n 🌐 LIVE HTTPS AUDIO STREAM URL:\n    ${fullStreamUrl}\n`);

        // Copy to Windows Clipboard
        try {
            execSync(`powershell -Command "Set-Clipboard -Value '${fullStreamUrl}'"`);
            echo(' 📋 COPIED TO CLIPBOARD!');
        } catch(clipErr) {
            echo(' ⚠️ Copy to clipboard notice: ' + clipErr.message);
        }

        // Auto Sync URL to Supabase
        autoPublishToSupabase(fullStreamUrl);

        echo('\n============================================================');
        echo(' Leave this window open while streaming live!');
        echo('============================================================\n');
    }
}

tunnel.stdout.on('data', parseTunnelOutput);
tunnel.stderr.on('data', parseTunnelOutput);

tunnel.on('close', (code) => {
    echo(`\n⚠️ SSH Tunnel exited (code ${code}). Reconnecting in 5s...`);
    setTimeout(() => {
        echo('🔄 Restarting tunnel...');
        const retryTunnel = spawn('ssh', [
            '-o', 'StrictHostKeyChecking=no',
            '-o', 'ServerAliveInterval=30',
            '-o', 'ExitOnForwardFailure=yes',
            '-R', '80:127.0.0.1:8001',
            'nokey@localhost.run'
        ], { stdio: ['ignore', 'pipe', 'pipe'] });
        retryTunnel.stdout.on('data', parseTunnelOutput);
        retryTunnel.stderr.on('data', parseTunnelOutput);
    }, 5000);
});

// Keep process alive so the tunnel remains connected during live service
process.stdin.resume();

async function cleanShutdown() {
    echo('\n🛑 Shutting down radio studio... Setting live status to OFFLINE in Supabase...');
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/app_settings?key=eq.live_audio`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                value: { audioUrl: '', isLive: false, announcement: 'DCLM OSUN 2 HQ Audio Feed Offline.' },
                last_updated: new Date().toISOString()
            })
        });
        await fetch(`${SUPABASE_URL}/rest/v1/app_settings?key=eq.radio_broadcast`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        echo('✅ Live status set to OFFLINE in Supabase.');
    } catch (e) {
        echo('Notice during cleanup: ' + e.message);
    }
    process.exit(0);
}

process.on('SIGINT', cleanShutdown);
process.on('SIGTERM', cleanShutdown);

