import { createClient } from '@supabase/supabase-js';
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
    const { data, error } = await supabase.from('notifications').select('*').limit(2);
    console.log("NOTIFS:", JSON.stringify(data, null, 2));
    console.log("ERR:", error);
}
run();
