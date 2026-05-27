import { Router } from 'express'
import authRouter from './modules/auth'
import usersRouter from './modules/users'
import itemsRouter from './modules/items'
import rentalsRouter from './modules/rentals'
import paymentsRouter from './modules/payments'
import depositsRouter from './modules/deposits'
import disputesRouter from './modules/disputes'
import adminRouter from './modules/admin'
import analyticsRouter from './modules/analytics'
import notificationsRouter from './modules/notifications'
import categoriesRouter from './modules/categories'
import citiesRouter from './modules/cities'
import kycRouter from './modules/kyc'
import creditRouter from './modules/credit'
import wholesalerRouter from './modules/wholesaler'
import chatRouter from './modules/chat'
import visionRouter from './modules/vision'
import pricingRouter from './modules/pricing'

export const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/users', usersRouter)
apiRouter.use('/items', itemsRouter)
apiRouter.use('/rentals', rentalsRouter)
apiRouter.use('/payments', paymentsRouter)
apiRouter.use('/deposits', depositsRouter)
apiRouter.use('/disputes', disputesRouter)
apiRouter.use('/admin', adminRouter)
apiRouter.use('/analytics', analyticsRouter)
apiRouter.use('/notifications', notificationsRouter)
apiRouter.use('/categories', categoriesRouter)
apiRouter.use('/cities', citiesRouter)
apiRouter.use('/kyc', kycRouter)
apiRouter.use('/credit', creditRouter)
apiRouter.use('/wholesaler', wholesalerRouter)
apiRouter.use('/chat', chatRouter)
apiRouter.use('/vision', visionRouter)
apiRouter.use('/pricing', pricingRouter)
