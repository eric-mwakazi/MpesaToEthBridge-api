const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mpesa-ETH Bridge API",
      version: "1.0.0",
      description: "API to interact with the MpesaEthBridge smart contract",
    },
  },
  apis: ["./index.js"], // Path to your API docs
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
