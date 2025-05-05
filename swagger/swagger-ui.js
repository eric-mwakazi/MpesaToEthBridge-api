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
        url:
          process.env.NODE_ENV === "production"
            ? "https://mpesa-to-eth-bridge-api.vercel.app/api/"
            //: "http://localhost:3000/api/",
            : "hhttps://d868-102-210-25-18.ngrok-free.app/api"
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = {
  swaggerSpec,
};
