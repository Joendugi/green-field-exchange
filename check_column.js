import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ktrisnezcdsedqrsiujr.supabase.co";
const supabaseKey = "sb_publishable_AsvtcwDElUo6ydxK5D9OMw_amhRK-iu";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
    const { data, error } = await supabase
        .from('products')
        .select('image_storage_path')
        .limit(1);
    
    if (error) {
        console.error("Column check error:", error.message);
    } else {
        console.log("Column 'image_storage_path' exists.");
    }
}

checkColumn();
