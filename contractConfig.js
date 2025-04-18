require("dotenv").config();
const { ethers } = require("ethers");
const contractABI = require("./abi/MpesaEthBridge.json");

const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_SEPOLIA);
const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

module.exports = { contract };
