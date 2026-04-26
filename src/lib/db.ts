import { Pool } from 'pg'

declare global {
  var pgPool: Pool | undefined
}

const pool =
  global.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })

if (process.env.NODE_ENV !== 'production') {
  global.pgPool = pool
}

export default pool

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  if (process.env.NODE_ENV === 'development') {
    console.log('query', { text: text.slice(0, 80), duration, rows: res.rowCount })
  }
  return res.rows
}

export async function getClient() {
  return await pool.connect()
}
