// utils/payhero.js
const axios = require("axios");
const moment = require("moment");
const { ethers } = require('ethers');
const { supabase } = require("../supabase/supabaseClient");
const { generateBasicAuthToken, preparePhoneNumber} = require('./helpers');
const dotenv = require('dotenv');
const  { contract }  = require("../../configs/contractConfig");
dotenv.config();

const initiateSTKPush = async ({ phoneNumber, amount,INVOICE }) => {
  try {
    const basicAuthToken = generateBasicAuthToken();
    const channel_id = Number(process.env.CHANNEL_ID);
    const external_reference = `INV-${Date.now()}`;
    const callback_url = process.env.CALLBACK_URL;
    const PayHero_url = process.env.PAYHERO_API_URL;
    
    phone = preparePhoneNumber(phoneNumber);
    amount = Number(amount);

    // Validate required fields are there
    if (!basicAuthToken || !amount || !phone || !PayHero_url || !callback_url) {
      return {
        success: false,
        message: 'Missing required parameters',
        error: {
          basicAuthToken,
          amount,
          phone,
          PayHero_url,
          callback_url
        }
      };
    }

    console.log('CALLBACK: ' + callback_url);

    const response = await axios.post(
      PayHero_url,
      {
        amount,
        phone_number: phone,
        channel_id,
        provider: 'm-pesa',
        external_reference: INVOICE,
        callback_url
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: basicAuthToken
        }
      }
    );

    const resData = response.data;
    if (!resData || !resData.CheckoutRequestID) {
      return {
        success: false,
        message: 'Invalid API response from PayHero',
        data: resData
      };
    }

    return {
        success: true,
        data: {
          MerchantRequestID: resData.MerchantRequestID || `merchant_${Date.now()}`,
          CheckoutRequestID: resData.CheckoutRequestID,
          external_reference
        }
      };
      
  } catch (error) {
    console.error('PayHero STK push failed:', error?.response?.data || error.message);
    return {
      success: false,
      message: 'STK push failed',
      error: error?.response?.data || error.message
    };
  }
};
/**
 * Extract phone number and amount from the callback metadata.
 */
const extractCallbackMetadata = (response) => {
    if (!response) return {};
  
    const {
      Amount: amount,
      Phone: phone,
      MpesaReceiptNumber: MpesaReceiptNumber,
      MerchantRequestID: merchantRequestId,
      CheckoutRequestID: checkoutRequestId,
      ExternalReference: externalReference,
      ResultCode: resultCode,
      ResultDesc: resultDesc,
      Status: status
    } = response;
  
    return {
      amount,
      phone,
      MpesaReceiptNumber,
      merchantRequestId,
      checkoutRequestId,
      externalReference,
      resultCode,
      resultDesc,
      status
    };
  };
  


/**
 * Process the payment after confirmation (send ETH and update the transaction).
 */
const processSuccessfulPayment = async (txn, amount, phone, MpesaReceiptNumber) => {

    const amountInWei = BigInt(amount) * 1_000_000_000_000_000n;
    const amountInEth = ethers.formatEther(amountInWei);
    console.log(` Callback received at processSuccessfulPayment with ETH to send ${amountInEth}`)
    // Send ETH via smart contract
    const tx = await contract.sendEthWithFee(txn.receiver, amountInWei);
    await tx.wait();
  
    // Update transaction status in Supabase
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "SUCESS",
        amount_kes: amount,
        amount_eth: amountInEth,
        phone,
        tx_hash: tx.hash,
        MpesaReceiptNumber: MpesaReceiptNumber
      })
      .eq("checkout_request_id", txn.checkout_request_id);
  
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
    .update({ status: "FAILED" })
    .eq("merchant_request_id", CheckoutRequestID);

  if (error) {
    console.error("❌ Error rejecting transaction:", error.message);
  }
};

/**
 * Fetch the transaction from the database by CheckoutRequestID.
 */
const getTransactionByCheckoutRequestID = async (CheckoutRequestID) => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("checkout_request_id", CheckoutRequestID)
      .single();
  
    if (error || !data) {
      console.warn("⚠️ Transaction not found for CheckoutRequestID:", CheckoutRequestID);
      return null;
    }
    return data;
};

module.exports = {
    initiateSTKPush,
    getTransactionByCheckoutRequestID,
    extractCallbackMetadata,
    processSuccessfulPayment,
    rejectTransaction
  };