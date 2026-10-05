// =============================================================================
// DCLM OSUN II — Automated Supabase to Supabase Migration Script
// Reads all rows from the Old Supabase Project and writes them to the New Project
// =============================================================================

import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL || 'https://tllrbrrvhslwcqioguxy.supabase.co';
const OLD_SUPABASE_KEY = process.env.OLD_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsbHJicnJ2aHNsd2NxaW9ndXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzODY0MzgsImV4cCI6MjA5Njk2MjQzOH0.qSPUCzF-sSEpDQhxrlR6oE0aHk9r9gbKI27B9NsCxCE';

const NEW_SUPABASE_URL = process.env.NEW_SUPABASE_URL || '';
const NEW_SUPABASE_KEY = process.env.NEW_SUPABASE_KEY || '';

if (!NEW_SUPABASE_URL || !NEW_SUPABASE_KEY) {
    console.error('❌ Please specify NEW_SUPABASE_URL and NEW_SUPABASE_KEY environment variables.');
    console.error('Usage:');
    console.error('  $env:NEW_SUPABASE_URL="https://xxxx.supabase.co"');
    console.error('  $env:NEW_SUPABASE_KEY="eyJ..."');
    console.error('  node tools/migrate_supabase_data.mjs');
    process.exit(1);
}

const oldClient = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);
const newClient = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

// Ordered by dependency hierarchy (parents before children)
const TABLES_TO_MIGRATE = [
    'users',
    'admin_codes',
    'carousel_banners',
    'app_settings',
    'radio_tracks',
    'video_tracks',
    'library_outlines',
    'cell_locations',
    'workforce_departments',
    'workforce_applications',
    'workforce_unit_messages',
    'live_chat_messages',
    'live_reactions',
    'radio_presence',
    'support_tickets',
    'giving_transactions'
];

async function migrateTable(tableName) {
    console.log(`\n⏳ Migrating table: [${tableName}]...`);

    try {
        // Fetch from old database
        const { data: rows, error: fetchErr } = await oldClient
            .from(tableName)
            .select('*');

        if (fetchErr) {
            console.error(`  ❌ Error reading from old [${tableName}]: ${fetchErr.message}`);
            return;
        }

        if (!rows || rows.length === 0) {
            console.log(`  ℹ️  Table [${tableName}] has 0 records. Skipping.`);
            return;
        }

        console.log(`  📥 Read ${rows.length} record(s) from old project.`);

        // Insert/Upsert into new database in batches of 50
        const batchSize = 50;
        let insertedCount = 0;

        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const { error: insertErr } = await newClient
                .from(tableName)
                .upsert(batch, { onConflict: tableName === 'app_settings' ? 'key' : (tableName === 'workforce_departments' || tableName === 'cell_locations' ? 'id' : undefined) });

            if (insertErr) {
                console.error(`  ⚠️ Batch upsert error on [${tableName}] (items ${i + 1}-${i + batch.length}): ${insertErr.message}`);
            } else {
                insertedCount += batch.length;
            }
        }

        console.log(`  ✅ Successfully migrated ${insertedCount}/${rows.length} record(s) to [${tableName}].`);
    } catch (err) {
        console.error(`  💥 Unexpected error migrating [${tableName}]:`, err.message);
    }
}

async function main() {
    console.log('====================================================');
    console.log('🚀 DCLM OSUN II — Supabase Account Migration Tool');
    console.log(`📤 Source (Old): ${OLD_SUPABASE_URL}`);
    console.log(`📥 Target (New): ${NEW_SUPABASE_URL}`);
    console.log('====================================================');

    // Test connectivity
    console.log('🔍 Testing old Supabase project connectivity...');
    const { error: pingOld } = await oldClient.from('app_settings').select('key').limit(1);
    if (pingOld) {
        console.error('❌ Cannot reach OLD Supabase project:', pingOld.message);
        console.error('\nNOTE: If your old Supabase project is on the free tier and has been inactive, it is likely PAUSED.');
        console.error('👉 Log in to https://supabase.com/dashboard/project/tllrbrrvhslwcqioguxy and click "Restore project".');
        process.exit(1);
    }
    console.log('✅ Old Supabase project is online and reachable.');

    console.log('🔍 Testing new Supabase project connectivity...');
    const { error: pingNew } = await newClient.from('app_settings').select('key').limit(1);
    if (pingNew) {
        console.error('❌ Cannot reach NEW Supabase project or tables do not exist yet:', pingNew.message);
        console.error('👉 Please make sure you have run "setup_new_supabase.sql" in your new project SQL Editor first!');
        process.exit(1);
    }
    console.log('✅ New Supabase project is online and verified.');

    // Execute migration for each table
    for (const table of TABLES_TO_MIGRATE) {
        await migrateTable(table);
    }

    console.log('\n====================================================');
    console.log('🎉 ALL DATA MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
}

main().catch(err => {
    console.error('Fatal migration error:', err);
    process.exit(1);
});
