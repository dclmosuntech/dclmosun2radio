import fetch from 'node-fetch';

const siteId = 'c67489dd-dc32-4499-8d34-b9b8776eaba8';
const token = 'nfp_3y4b24ifqyyQopndkHo6FDU6eAPHJ4xp8080';

const envVars = [
    { key: 'VITE_SUPABASE_URL', value: 'https://qksslhnlyjwnieiilcsf.supabase.co' },
    { key: 'VITE_SUPABASE_ANON_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrc3NsaG5seWp3bmllaWlsY3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MDU4MTEsImV4cCI6MjEwNjA4MTgxMX0.OSQP98iLjBkt4a3sNMFyMMpB67Kn2ySSv0_1OBfUtNM' }
];

async function main() {
    console.log("⚙️ Setting Netlify site environment variables...");
    
    // First get account_id of the site
    const siteRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!siteRes.ok) {
        console.error("Failed to fetch site info:", siteRes.status, await siteRes.text());
        return;
    }
    const siteInfo = await siteRes.json();
    const accountId = siteInfo.account_id || siteInfo.account_slug;
    console.log(`Account ID: ${accountId}`);

    for (const env of envVars) {
        const envRes = await fetch(`https://api.netlify.com/api/v1/accounts/${accountId}/env?site_id=${siteId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([{
                key: env.key,
                values: [{ value: env.value, context: 'all' }]
            }])
        });
        console.log(`Env ${env.key} set status:`, envRes.status);
    }
}

main();
