const express = require("express");
const cors = require("cors");
const bridgeRoutes = require("./routes/bridge");
const { swaggerUi, generateSwaggerSpec } = require("./swagger/swagger-ui");

const app = express();

app.use(cors());
app.use(express.json());

// Your API
app.use("/api", bridgeRoutes);

// Serve Swagger UI correctly
app.use("/api-docs", swaggerUi.serve, (req, res, next) => {
  const spec = generateSwaggerSpec(req);
  swaggerUi.setup(spec)(req, res, next);
});

// Handle base route
app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

// Make sure this is LAST
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is live on http://localhost:${PORT}`);
});
