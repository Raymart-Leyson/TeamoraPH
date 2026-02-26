const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDb() {
    const { data, error } = await supabase.from("subscriptions").select("id").limit(1);
    if (error) {
        console.error("\n❌ Database error:", error.message);
    } else {
        console.log("\n✅ Subscriptions table exists!");
    }
}

checkDb();
