const Pool = require("pg").Pool

const pool = new Pool({
      user: "dougmoreira",
      password: "amor1512",
      database: "users_db",
      host:"localhost",
      port: 5432
})

module.exports = pool