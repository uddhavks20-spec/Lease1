import 'dotenv/config'
import express, { type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { apiRouter } from './routes/index'
import { errorHandler } from './middleware/errorHandler'

const app = express()

// Security headers
app.use(helmet())

// CORS
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*'
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
)

// Body parsers
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging
app.use(morgan('combined'))

// Basic rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Health check
app.get('/health', (_req: Request, res: Response) => res.json({ ok: true, ts: Date.now() }))

// API routes
app.use('/api', apiRouter)

// Error handler
app.use(errorHandler)

export default app
