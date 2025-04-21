// swagger.js
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

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
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsDoc(options);

// 👇 Make sure both `swaggerUi` and `swaggerSpec` are exported
module.exports = {
  swaggerUi,
  swaggerSpec,
};


