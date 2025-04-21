const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
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
      status: "PENDING"
    }
  ]);

if (dummyInsert.error) {
  console.error("❌ Dummy insert failed:", dummyInsert.error);
} else {
  console.log("✅ Dummy insert successful:", dummyInsert.data);
}
└──╼ $node supa.js 
file:///home/mshapa/Desktop/MpesaToEthBridge-api/supa.js:1
const { createClient } = require('@supabase/supabase-js');
                         ^

ReferenceError: require is not defined in ES module scope, you can use import instead
    at file:///home/mshapa/Desktop/MpesaToEthBridge-api/supa.js:1:26
    at ModuleJob.run (node:internal/modules/esm/module_job:271:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:578:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:116:5)

Node.js v22.14.0