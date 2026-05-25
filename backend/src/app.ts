import 'dotenv/config'
import express, { type Request, type Response } from 'express'
// @ts-ignore
import cors from 'cors'
import helmet from 'helmet'
// @ts-ignore
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { apiRouter } from './routes/index'
import { errorHandler } from './middleware/errorHandler'
import { initBootstrap } from './utils/init'

const app = express()

// Security headers
app.use(helmet())

// CORS
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*'
app.use(
  cors({
    origin: true,
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
app.get('/health', (_req: Request, res: Response) => res.json({ ok: true, ts: Date.now(), env: process.env.NODE_ENV }))

// Welcome route
app.get('/', async (_req: Request, res: Response) => {
  // Run bootstrap on every root hit in Vercel to ensure admin exists
  if (process.env.VERCEL) {
    await initBootstrap().catch(console.error)
  }
  res.json({
    message: 'Lease API is running',
    version: '1.0.0',
    status: 'online',
    docs: '/api-docs'
  })
})

// API routes
app.use('/api', apiRouter)

// Error handler
app.use(errorHandler)

export default app
