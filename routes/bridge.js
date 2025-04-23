const express = require("express");
const { ethers } = require('ethers');
const {
  initiateSTKPush,
  getTransactionByMerchantId,
  extractCallbackMetadata,
  processSuccessfulPayment,
  rejectTransaction
} = require("../utils/mpesa/mpesa");
const { supabase }    = require("../utils/supabase/supabaseClient");
const router = express.Router();
const  { contract }  = require("../configs/contractConfig");

/**
 * @swagger
 * /send:
 *   post:
 *     summary: Sends ETH equivalent after successful M-Pesa STK Push from the contract to the receiver.
 *     tags: [Bridge]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiver
 *               - amountInKes
 *               - phoneNumber
 *             properties:
 *               receiver:
 *                 type: string
 *                 description: Ethereum wallet address of the receiver.
 *               amountInKes:
 *                 type: number
 *                 description: Amount in Kenyan Shillings to initiate the M-Pesa STK push.
 *                 example: 1
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number to receive the M-Pesa STK push.
 *                 example: "254712345678"
 *     responses:
 *       200:
 *         description: ETH transfer successful and M-Pesa STK push initiated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 txHash:
 *                   type: string
 *       400:
 *         description: Missing required fields.
 *       402:
 *         description: STK Push failed.
 *       500:
 *         description: Internal server error.
 */
router.post("/send", async (req, res) => {
  const { receiver, amountInKes, phoneNumber } = req.body;

  // Validate inputs
  if (!receiver || !amountInKes || !phoneNumber) {
    return res.status(400).json({ error: "receiver, amountInKes, and phoneNumber are required" });
  }

  if (!ethers.isAddress(receiver)) {
    return res.status(400).json({ error: "Invalid Ethereum address" });
  }

  try {
    // 1️⃣ Initiate STK Push via Safaricom
    const mpesaResponse = await initiateSTKPush({ amount: amountInKes, phoneNumber });

    if (!mpesaResponse.success) {
      return res.status(402).json({ error: "STK Push failed", details: mpesaResponse.error });
    }

    const { MerchantRequestID, CheckoutRequestID } = mpesaResponse.data;

    // 2️⃣ Convert KES to ETH format
    const amountInWei = BigInt(amountInKes) * 1_000_000_000_000_000n;
    const amountInEth = ethers.formatEther(amountInWei);

    // 3️⃣ Log transaction as PENDING — smart contract will be triggered from /callback
    const { error: dbError } = await supabase.from("transactions").insert([
      {
        receiver,
        phone: phoneNumber,
        amount_kes: amountInKes,
        amount_eth: amountInEth,
        merchant_request_id: MerchantRequestID,
        checkout_request_id: CheckoutRequestID,
        status: "PENDING"
      }
    ]);

    if (dbError) {
      console.error("📦 Supabase insert error:", dbError.message);
    }

    // 4️⃣ Respond to client
    res.json({
      success: true,
      message: "STK push sent. Waiting for user confirmation...",
      mpesaResponse: mpesaResponse.data
    });
  } catch (error) {
    console.error("🚨 Error in /send:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});



/**
 * @swagger
 * /callback:
 *   post:
 *     summary: Callback endpoint to process the result of M-Pesa STK push.
 *     tags: [Bridge]
 *     description: Safaricom sends the payment result to this endpoint after the user enters their M-Pesa PIN.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Body:
 *                 type: object
 *                 properties:
 *                   stkCallback:
 *                     type: object
 *                     properties:
 *                       MerchantRequestID:
 *                         type: string
 *                       ResultCode:
 *                         type: integer
 *                       CallbackMetadata:
 *                         type: object
 *                         properties:
 *                           Item:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 Name:
 *                                   type: string
 *                                 Value:
 *                                   oneOf:
 *                                     - type: string
 *                                     - type: integer
 *     responses:
 *       200:
 *         description: Callback processed
 */
router.post("/callback", async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) {
      return res.status(400).json({ error: "Invalid callback payload" });
    }

    const merchantId = callback.MerchantRequestID;
    const resultCode = callback.ResultCode;

    const txn = await getTransactionByMerchantId(merchantId);
    if (!txn) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (resultCode === 0) {
      const { phone, amount } = extractCallbackMetadata(callback.CallbackMetadata);
      if (!amount || !phone) {
        return res.status(400).json({ error: "Incomplete metadata in callback" });
      }

      const data = await processSuccessfulPayment(txn, amount, phone);
      return res.status(200).json({
        success: true,
        message: `Payment confirmed. ${data.amount} ETH sent.`,
        txHash: data.hash
      });      
    }

    // Handle rejection or failure
    await rejectTransaction(merchantId);
    return res.status(200).json({ success: false, message: "STK push rejected or failed." });
  } catch (err) {
    console.error("🚨 /callback error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});



/**
 * @swagger
 * /withdraw:
 *   post:
 *     summary: Withdraw ETH from the contract to admin wallet.
 *     tags: [Bridge]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amountInEth:
 *                 type: number
 *                 example: 0.01
 *     responses:
 *       200:
 *         description: Withdrawal successful
 */
router.post("/withdraw", async (req, res) => {
  try {
    const { amountInEth } = req.body;

    if (!amountInEth) {
      return res.status(400).json({ error: "amountInEth is required" });
    }

    const amountInWei = ethers.parseEther(amountInEth.toString());

    // Send ETH from contract to admin wallet
    const tx = await contract.feesEarningWallet(); // get admin wallet from contract
    const sendTx = await contract.signer.sendTransaction({
      to: tx,
      value: amountInWei,
    });

    await sendTx.wait();
    res.json({ status: "withdrawal successful", txHash: sendTx.hash });
  } catch (err) {
    console.error("❌ Withdraw failed:", err);
    res.status(500).json({ error: err.message || "Withdrawal failed" });
  }
});



/**
 * @swagger
 * /balance:
 *   get:
 *     summary: Get contract balance in ETH.
 *     tags: [Bridge]
 *     responses:
 *       200:
 *         description: Contract balance
 */
router.get("/balance", async (req, res) => {
  try {
    const balance = await contract.getContractBalance();
    // Convert BigInt (wei) to readable ETH
    const balanceInEth = ethers.formatEther(balance);
    res.json({ balance: `${balanceInEth} ETH` });
  } catch (err) {
    console.error("🚨 Error in /balance:", error);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
