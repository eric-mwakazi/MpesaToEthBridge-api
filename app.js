const express = require("express");
const app = express();
const bridgeRoutes = require("./routes/bridge");
const { swaggerUi, swaggerSpec } = require("./swagger/swagger-ui");
const cors = require('cors');
const CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.1.0/swagger-ui.min.css';
// Middleware
app.use(cors());
app.use(express.json());
// Redirect the home page to /api-docs
app.get('/', (req, res) => {
    res.redirect('/api-docs');
  });
app.use("/api", bridgeRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCssUrl: CSS_URL }))


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port localhost:${PORT}`));
