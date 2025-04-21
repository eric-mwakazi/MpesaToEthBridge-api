require("dotenv").config();
const { ethers } = require("ethers");
const contractABI = require("./abi/MpesaEthBridge.json");

const { ALCHEMY_RPC_SEPOLIA, WALLET_PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

if (!ALCHEMY_RPC_SEPOLIA || !WALLET_PRIVATE_KEY || !CONTRACT_ADDRESS) {
  throw new Error("Missing environment variables in .env file");
}

const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC_SEPOLIA);
const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

module.exports = { contract };
