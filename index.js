require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");
const { swaggerUi, specs } = require("./swagger");
const abi = require("./contract/MpesaEthBridge.json");

const app = express();
app.use(express.json());

const provider = new ethers.JsonRpcProvider(process.env.INFURA_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

/**
 * @swagger
 * /balance:
 *   get:
 *     summary: Get contract ETH balance
 *     responses:
 *       200:
 *         description: Current ETH balance of the contract
 */
app.get("/balance", async (req, res) => {
  const balance = await contract.getContractBalance();
  res.json({ balance: ethers.formatEther(balance) });
});

/**
 * @swagger
 * /deposit:
 *   post:
 *     summary: Deposit ETH into the contract
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Deposit successful
 */
app.post("/deposit", async (req, res) => {
  const { amount } = req.body;
  try {
    const tx = await wallet.sendTransaction({
      to: process.env.CONTRACT_ADDRESS,
      value: ethers.parseEther(amount.toString()),
    });
    await tx.wait();
    res.json({ status: "success", txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /send:
 *   post:
 *     summary: Admin sends ETH to receiver and triggers Mpesa withdrawal event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiver:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: ETH sent and event emitted
 */
app.post("/send", async (req, res) => {
  const { receiver, amount } = req.body;
  try {
    const tx = await contract.sendEth(receiver, amount);
    await tx.wait();
    res.json({ status: "success", txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}/api-docs`));
