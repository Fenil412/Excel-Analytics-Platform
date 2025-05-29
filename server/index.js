const express = require("express")
const cors = require("cors")
const connectDB = require('./config/db');
const dotenv = require("dotenv")
const path = require("path")
const fs = require("fs")

dotenv.config()

const app = express()

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*"

connectDB();

app.use(express.json())
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
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body)
  next()
})

const uploadDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/user")
const adminRoutes = require("./routes/admin")
const excelRoutes = require('./routes/excel');

app.use("/api/auth", authRoutes)
app.use("/api/user", userRoutes)
app.use("/api/admin", adminRoutes)
app.use('/api/uploads', excelRoutes);

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
