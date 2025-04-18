const express = require("express");
const app = express();
const bridgeRoutes = require("./routes/bridge");
const { swaggerUi, swaggerSpec } = require("./swagger");

app.use(express.json());
app.use("/api", bridgeRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
