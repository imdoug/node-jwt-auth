require('dotenv').config()

const { Pool } = require('pg')
const isProduction = process.env.NODE_ENV === 'production'

const connectionString = `postgresql://dougmoreira:amor1512@localhost:5432/users_db`

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
  ssl: { rejectUnauthorized: false },
})

module.exports =  pool 



