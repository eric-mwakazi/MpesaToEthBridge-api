const express = require("express");
const router = express.Router();
const { contract } = require("../configs/contractConfig");

/**
 * @swagger
 * /send:
 *   post:
 *     summary: Send ETH from contract to receiver with admin fee deducted.
 *     tags: [Bridge]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiver:
 *                 type: string
 *               amountInEth:
 *                 type: number
 *                 example: 0.1
 *     responses:
 *       200:
 *         description: Transaction successful.
 */
const { ethers } = require("ethers");

router.post("/send", async (req, res) => {
  const { receiver, amountInEth } = req.body;

  try {
    if (!receiver || !amountInEth) {
      return res.status(400).json({ error: "receiver and amountInEth are required" });
    }

    // parseEther is directly on ethers in v6
    const amountInWei = ethers.parseEther(amountInEth.toString());

    // Contract call
    const tx = await contract.sendEthWithFee(receiver, amountInWei);
    await tx.wait();

    res.json({ status: "success", txHash: tx.hash });
  } catch (err) {
    console.error("❌ Transaction failed:", err);
    res.status(500).json({ error: err.message || "Transaction failed" });
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
    res.status(500).json({ error: err.message });
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

module.exports = router;
