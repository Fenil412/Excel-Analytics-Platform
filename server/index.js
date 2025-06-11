const express = require("express")
const cors = require("cors")
const connectDB = require('./config/db');
const dotenv = require("dotenv")
const path = require("path")
const fs = require("fs")

dotenv.config()

const app = express()

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173"

connectDB();

app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use(
  cors({
    origin: [FRONTEND_ORIGIN, "http://localhost:3000", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add this before your routes
app.use((error, req, res, next) => {
  console.error("Error:", error)

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large" })
  }

  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
  })
})

const uploadDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/user")
const adminRoutes = require("./routes/admin")
const excelRoutes = require('./routes/excel');
const chartsRoutes = require('./routes/charts');

const chartHistoryRoutes = require('./routes/chartHistory');
const chartDownloadRoutes = require('./routes/chartDownload');

// Add the new routes
app.use('/api/charts', chartHistoryRoutes);
app.use('/api/charts', chartDownloadRoutes);

app.use("/api/auth", authRoutes)
app.use("/api/user", userRoutes)
app.use("/api/admin", adminRoutes)
app.use('/api/uploads', excelRoutes);
app.use('/api/charts', chartsRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
