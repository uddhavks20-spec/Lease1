import app from './app'
import { initBootstrap } from './utils/init'

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000

initBootstrap()
  .catch(() => {})
  .finally(() => {
    console.log(`API server listening on port ${PORT}`)
    app.listen(PORT)
  })
