const express = require('express')
const app = express()
const pool = require('./db')
const jwt = require('jsonwebtoken')

const cors = require('cors')


const bcrypt = require('bcrypt')
require ('dotenv').config();

const PORT = process.env.PORT || 3003;

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors())

app.get("/", (req, res) => {
      res.json({ message: "Welcome to my application." });
    });

// Create 
app.post('/signup', async (req,res) =>{
      try {
            const { name, email, password, role  } = req.body
            const hashedPass = await bcrypt.hash(password, 10)
            const newUser = await pool.query(`INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING *`, [name, email, hashedPass, role])
            const accessToken = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET )
            res.json({ name, email, role, accessToken: accessToken})
      } catch (error) {
            res.status(500)
            .send('Catched Error: ' + error)      
      }
})
// Authorization
app.post('/login', async (req,res) =>{
      const { email, password } = req.body
      const userQuery = await pool.query(`SELECT * FROM users WHERE email = $1`, [email])
      if(userQuery == null ){
            return res.status(400).send("User can not be found")
      }
      try {
            if(await bcrypt.compare(password, userQuery.rows[0].password)){
                  const {email, name, role } = userQuery.rows[0]
                  const accessToken = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET )
                  res.json({ name, email, role, accessToken: accessToken})
            }else{
                  res.send('Not Allowed')
            }
      } catch (error) {
            console.log(error)
      }  
})

const authenticateToken = (req,res,next)=>{
      const token = req.headers["x-acess-token"]
      if(!token) res.send("Missing Token")
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, user)=>{
            if(error) res.json({Auth: false, message: "Fail to authenticate"}) 
            req.user = user 
            next()
      })
}
// Read
app.get('/users', authenticateToken, async (req,res) =>{
      const users = await pool.query("SELECT  * FROM users")
      res.json(users.rows)
})
// Update
app.put("/users/:id", async (req,res) =>{
      try {
            const { id } = req.params
            const  { name } = req.body
            const updatedUser = await pool.query("UPDATE users SET name = $1 WHERE user_id = $2",[name,id])
            res.json("User Updated")
      } catch (error) {
          console.error(error)  
      }
})
// Delete
app.delete('/users/:id', async (req,res) =>{
      try {
            const { id } = req.params
            const delUser = await pool.query("DELETE FROM users WHERE user_id = $1", [id])
            res.json("User Deleted")
      } catch (error) {
            console.error(error)
      }
})



app.listen(PORT, () => console.log('Server started at port:' + PORT))