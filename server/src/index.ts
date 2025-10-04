import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import organizationRoutes from './routes/organizations'
import invitationRoutes from './routes/invitations'
import profileRoutes from './routes/profiles'
import projectRoutes from './routes/projects'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/organizations', organizationRoutes)
app.use('/api/invitations', invitationRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/projects', projectRoutes)

// Error handling
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
