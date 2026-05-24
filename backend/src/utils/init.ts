import bcrypt from 'bcryptjs'
import { db } from './db'

export async function initBootstrap() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!process.env.STARTUP_CREATE_ADMIN || process.env.STARTUP_CREATE_ADMIN !== 'true') return
  if (!email || !password) return
  const exists = await db.query(
    `SELECT u.id FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='admin' AND u.email=$1`,
    [email]
  )
  if (exists.rowCount) return
  const role = await db.query(`SELECT id FROM roles WHERE name='admin' LIMIT 1`)
  if (!role.rowCount) return
  const hash = await bcrypt.hash(password, 10)
  await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_verified)
     VALUES ($1,$2,'Admin','User',$3,true)`,
    [email, hash, role.rows[0].id]
  )
}
