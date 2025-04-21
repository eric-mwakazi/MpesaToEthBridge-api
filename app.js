const express = require("express");
const app = express();
const bridgeRoutes = require("./routes/bridge");
const { swaggerSpec } = require("./swagger/swagger-ui");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");

const CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.min.css';

app.use(cors());
app.use(express.json());

// Home redirect
app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

// Routes
app.use("/api", bridgeRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCssUrl: CSS_URL }));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port localhost:${PORT}`));    
module.exports = app;
