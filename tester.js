// supa.js
const {createClient} = require('@supabase/supabase-js');
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const run = async () => {
  const dummyInsert = await supabase
    .from("transactions")
    .insert([
      {
        receiver: "0x000000000000000000000000000000000000dead",
        phone: "0700123456",
        amount_kes: "1",
        amount_eth: "0.0001",
        merchant_request_id: "TEST1234567",
        checkout_request_id: "CHECKOUT1234567",
        status: "PENDING"
      }
    ]);

  if (dummyInsert.error) {
    console.error("❌ Dummy insert failed:", dummyInsert.error);
  } else {
    console.log("✅ Dummy insert successful:", dummyInsert.data);
  }
};

run();
