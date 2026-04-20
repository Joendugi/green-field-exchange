import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ktrisnezcdsedqrsiujr.supabase.co";
const supabaseKey = "sb_publishable_AsvtcwDElUo6ydxK5D9OMw_amhRK-iu";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error("Error listing buckets:", error);
    } else {
        console.log("Existing buckets:", data.map(b => b.name));
    }
}

checkBuckets();
