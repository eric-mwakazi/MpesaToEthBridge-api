// swagger.js
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ETH to M-Pesa Bridge API",
      version: "1.0.0",
    },
  },
  apis: ["./routes/*.js"], // your route docs
};

const swaggerSpec = swaggerJsdoc(options);

// Serve Swagger UI using CDN version (good for Vercel)
const swaggerDocument = swaggerSpec;

function swaggerDocs(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-standalone-preset.min.js'
    ]
  }));
}

module.exports = swaggerDocs;

