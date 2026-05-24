import axios from 'axios'

async function run() {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:4000/api'
  const api = axios.create({ baseURL })

  const renterEmail = `renter_${Date.now()}@test.com`
  const sellerEmail = `seller_${Date.now()}@test.com`
  const password = 'Password123!'

  const sellerReg = await api.post('/auth/register', {
    email: sellerEmail,
    password,
    firstName: 'Seller',
    lastName: 'Test',
    role: 'seller',
  })
  const sellerToken = sellerReg.data.token
  const sellerApi = axios.create({ baseURL, headers: { Authorization: `Bearer ${sellerToken}` } })

  const renterReg = await api.post('/auth/register', {
    email: renterEmail,
    password,
    firstName: 'Renter',
    lastName: 'Test',
    role: 'renter',
  })
  const renterToken = renterReg.data.token
  const renterApi = axios.create({ baseURL, headers: { Authorization: `Bearer ${renterToken}` } })

  const categories = (await api.get('/categories')).data.categories
  const cities = (await api.get('/cities')).data.cities

  const item = await sellerApi.post('/items', {
    title: 'Test Chair',
    description: 'Simple chair for testing',
    categoryId: categories[0].id,
    cityId: cities[0].id,
    monthlyRent: 500,
    depositAmount: 1000,
    minRentDuration: 1,
    maxRentDuration: 12,
  })
  const itemId = item.data.id

  const rental = await renterApi.post('/rentals', {
    itemId,
    durationMonths: 1,
  })

  if (!rental.data.order?.id) throw new Error('Order not created')
  console.log('E2E success: rental and order created', rental.data.order.id)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
