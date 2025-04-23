// utils/mpesa.js
const axios = require("axios");
const moment = require("moment");
require("dotenv").config();
const { ethers } = require('ethers');
const { supabase }    = require("../supabase/supabaseClient");
const  { contract }  = require("../../configs/contractConfig");
const {
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_CALLBACK_URL,
} = process.env;

const getAccessToken = async () => {
  const auth =
    "Basic " +
    Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");

  const { data } = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: { Authorization: auth },
    }
  );
  return data.access_token;
};

const initiateSTKPush = async ({ phoneNumber, amount }) => {
  try {
    const accessToken = await getAccessToken();
    const timestamp = moment().format("YYYYMMDDHHmmss");
    const password = Buffer.from(
      `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: "ETHMpesaBridge",
      TransactionDesc: "ETH to M-Pesa",
    };

    const { data } = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { success: true, data };
  } catch (err) {
    console.error("🔴 STK Push Error:", err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Fetch the transaction from the database by MerchantRequestID.
 */
const getTransactionByMerchantId = async (merchantId) => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("merchant_request_id", merchantId)
    .single();

  if (error || !data) {
    console.warn("⚠️ Transaction not found for MerchantRequestID:", merchantId);
    return null;
  }
  return data;
};

/**
 * Extract phone number and amount from the callback metadata.
 */
const extractCallbackMetadata = (metadata) => {
  const phone = metadata?.Item.find(i => i.Name === "PhoneNumber")?.Value;
  const amount = metadata?.Item.find(i => i.Name === "Amount")?.Value;
  return { phone, amount };
};

/**
 * Process the payment after confirmation (send ETH and update the transaction).
 */
const processSuccessfulPayment = async (txn, amount, phone) => {
  const amountInWei = BigInt(amount) * 1_000_000_000_000_000n;
  const amountInEth = ethers.formatEther(amountInWei);
  // Send ETH via smart contract
  const tx = await sendEthWithFee(txn.receiver, amountInWei);
  await tx.wait();

  // Update transaction status in Supabase
  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      status: "COMPLETED",
      amount_kes: amount,
      amount_eth: amountInEth,
      phone,
      tx_hash: tx.hash,
    })
    .eq("merchant_request_id", txn.merchant_request_id);

  if (updateError) {
    console.error("❌ Error updating transaction:", updateError.message);
  }
  let data = {hash: tx.hash, amount: amountInEth}
  return data;
};

/**
 * Reject the transaction in case of failure or user rejection.
 */
const rejectTransaction = async (merchantId) => {
  const { error } = await supabase
    .from("transactions")
    .update({ status: "REJECTED" })
    .eq("merchant_request_id", merchantId);

  if (error) {
    console.error("❌ Error rejecting transaction:", error.message);
  }
};
module.exports = {
  initiateSTKPush,
  getTransactionByMerchantId,
  extractCallbackMetadata,
  processSuccessfulPayment,
  rejectTransaction
};
