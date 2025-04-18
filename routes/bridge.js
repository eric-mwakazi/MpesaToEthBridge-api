const express = require("express");
const router = express.Router();
const { contract } = require("../contractConfig");

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
router.post("/send", async (req, res) => {
  const { receiver, amountInEth } = req.body;

  try {
    const amountInWei = ethers.parseEther(amountInEth.toString());
    const tx = await contract.sendEthWithFee(receiver, amountInWei);
    await tx.wait();
    res.json({ status: "success", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.json({ balance: balance.toString() + " ETH" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
