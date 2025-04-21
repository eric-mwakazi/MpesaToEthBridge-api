// swagger.js
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ETH to M-Pesa Bridge API",
      version: "1.0.0",
      description: "API documentation for the ETH to M-Pesa Bridge",
    },
  },
  apis: ["./routes/*.js"],
};

const generateSwaggerSpec = (req) => {
  const host = req.get("host");
  const protocol = req.protocol;

  return swaggerJsDoc({
    ...options,
    definition: {
      ...options.definition,
      servers: [
        {
          url: `${protocol}://${host}/api`,
        },
      ],
    },
  });
};

module.exports = {
  swaggerUi,            // ✅ properly export swaggerUi
  generateSwaggerSpec,
};
