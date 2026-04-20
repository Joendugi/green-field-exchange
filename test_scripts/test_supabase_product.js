
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ktrisnezcdsedqrsiujr.supabase.co";
const supabaseKey = "sb_publishable_AsvtcwDElUo6ydxK5D9OMw_amhRK-iu";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateProduct() {
  console.log("Testing Supabase product creation...");
  
  // Note: This requires a valid session or RLS to be disabled/configured for anon
  // Since we're testing the 'POST' failure, let's see what the database says about a manual insert
  // with the fields we found in products.ts
  
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: "Test Product " + Date.now(),
      description: "Test description that is long enough to pass validation",
      price: 10.99,
      quantity: 100,
      unit: "kg",
      category: "vegetables",
      location: "Test Location",
      currency: "USD"
      // farmer_id is missing here, which should trigger an RLS or NOT NULL error
      // But we want to see if 'quantity' or other fields cause a 'column does not exist' error
    })
    .select();

  if (error) {
    console.error("❌ Supabase Insert Error:", error.message);
    console.error("Full error object:", JSON.stringify(error, null, 2));
  } else {
    console.log("✅ Insert successful (unexpected without farmer_id):", data);
  }
}

testCreateProduct();
