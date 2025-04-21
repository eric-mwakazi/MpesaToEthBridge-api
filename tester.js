// supa.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // Load env vars from .env

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
        amount_kes: "100",
        amount_eth: "0.0001",
        merchant_request_id: "TEST12345",
        checkout_request_id: "CHECKOUT12345",
        status: "COMPLETED"
      }
    ]);

  if (dummyInsert.error) {
    console.error("❌ Dummy insert failed:", dummyInsert.error);
  } else {
    console.log("✅ Dummy insert successful:", dummyInsert.data);
  }
};

run();
