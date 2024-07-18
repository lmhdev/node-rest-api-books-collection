require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { expressjwt: jwt } = require("express-jwt");
const expressWinston = require("express-winston");
const cors = require("cors");

const sequelize = require("./config/database");
const bookRoutes = require("./routes/bookRoutes");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorHandler");
const rateLimiter = require("./middleware/rateLimiter");
const logger = require("./middleware/logger");

const app = express();
const port = process.env.PORT || 4567;

const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: false,
  })
);
app.use(rateLimiter);

app.use(
  "/api",
  jwt({ secret: process.env.JWT_SECRET, algorithms: ["HS256"] }).unless({
    path: ["/api/login", "/api/register"],
  })
);
app.use("/api", bookRoutes);
app.use("/api", authRoutes);

app.use(errorHandler);

sequelize
  .sync()
  .then(() => {
    console.log("Database synced");
  })
  .catch((error) => {
    console.error("Error syncing database:", error.message);
  });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
