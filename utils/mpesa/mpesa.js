// utils/mpesa.js
const axios = require("axios");
const moment = require("moment");
require("dotenv").config();
const { ethers } = require('ethers');
const { supabase } = require("../supabase/supabaseClient");
const {  preparePhoneNumber, getAccessToken} = require('./helpers');

const {
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_CALLBACK_URL,
} = process.env;



/*
Generate stk push from daraja api
*/
const initiateSTKPush = async ({ phoneNumber, amount }) => {
  try {
    const accessToken = await getAccessToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET );
    const timestamp = moment().format("YYYYMMDDHHmmss");
    const formattedPhone = preparePhoneNumber(phoneNumber);
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
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
const getTransactionByMerchantId = async (CheckoutRequestID) => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("checkout_request_id", CheckoutRequestID)
    .single();

  if (error || !data) {
    console.warn("⚠️ Transaction not found for MerchantRequestID:", CheckoutRequestID);
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
    .eq("checkout_request_id", txn.CheckoutRequestID);

  if (updateError) {
    console.error("❌ Error updating transaction:", updateError.message);
  }
  let data = {hash: tx.hash, amount: amountInEth}
  return data;
};

/**
 * Reject the transaction in case of failure or user rejection.
 */
const rejectTransaction = async (CheckoutRequestID) => {
  const { error } = await supabase
    .from("transactions")
    .update({ status: "REJECTED" })
    .eq("checkout_request_id", CheckoutRequestID);

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
