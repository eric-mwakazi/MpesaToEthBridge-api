// swagger.js
const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ETH to M-Pesa Bridge API",
      version: "1.0.0",
    },
    servers: [
      {
        url: "https://localhost:3000/api/",
        // prod
        url: "https://mpesa-to-eth-bridge-api.vercel.app/api/",
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsDoc(options);
module.exports = {
  swaggerSpec,
};


