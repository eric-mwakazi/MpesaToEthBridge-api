const express = require("express");
const cors = require("cors");
const bridgeRoutes = require("./routes/bridge");

const { swaggerUi, generateSwaggerSpec } = require("./swagger/swagger-ui");

const app = express();

app.use(cors());
app.use(express.json());

// Redirect home to Swagger
app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

app.use("/api", bridgeRoutes);

// ✅ Correct way to dynamically inject Swagger docs
app.use("/api-docs", swaggerUi.serve, (req, res, next) => {
  const swaggerSpec = generateSwaggerSpec(req);
  swaggerUi.setup(swaggerSpec)(req, res, next);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
