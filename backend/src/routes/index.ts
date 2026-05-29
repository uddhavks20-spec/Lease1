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
import bookingsRouter from './modules/bookings'
import visionRouter from './modules/vision'
import pricingRouter from './modules/pricing'
import availabilityRouter from './modules/availability'
import reviewsRouter from './modules/reviews'
import wishlistRouter from './modules/wishlist'
import sellerProfileRouter from './modules/seller-profile'
import couponsRouter from './modules/coupons'
import referralsRouter from './modules/referrals'
import personalityRouter from './modules/personality'

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
apiRouter.use('/bookings', bookingsRouter)
apiRouter.use('/vision', visionRouter)
apiRouter.use('/pricing', pricingRouter)
apiRouter.use('/availability', availabilityRouter)
apiRouter.use('/reviews', reviewsRouter)
apiRouter.use('/wishlist', wishlistRouter)
apiRouter.use('/seller-profile', sellerProfileRouter)
apiRouter.use('/coupons', couponsRouter)
apiRouter.use('/referrals', referralsRouter)
apiRouter.use('/personality', personalityRouter)
