
const express = require('express')
const app = express()
const pool = require('./db')
const jwt = require('jsonwebtoken')
const cors = require('cors')


const bcrypt = require('bcrypt')
require ('dotenv').config();

const PORT = process.env.PORT || 5000;

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors())

app.get("/", (req, res) => {
      res.send("Welcome to my application.");
    });

// Create 
app.post('/signup', async (req,res) =>{
      try {
            const { name, email, password, role  } = req.body
            const hashedPass = await bcrypt.hash(password, 10)
            const newUser = await pool.query(`INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING *`, [name, email, hashedPass, role])
            const accessToken = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET )
            res.json({id:newUser.rows[0].user_id, name, email, role, accessToken: accessToken})
      } catch (error) {
            res.status(500)
            .send('Catched Error: ' + error)      
      }
})
// Authorization
app.post('/login', async (req,res) =>{

      const { email, password } = req.body
      const userQuery = await pool.query(`SELECT * FROM users WHERE email = $1`, [email])
      if(userQuery.rowCount == 0 ){
            return res.send("user not found")
      }else{
            try {
                  if(await bcrypt.compare(password, userQuery.rows[0].password)){
                        const {email, name, role, user_id } = userQuery.rows[0]
                        const accessToken = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET )
                        res.json({ id: user_id, name, email, role, accessToken: accessToken})
                  }else{
                        res.send(null)
                  }
            } catch (error) {
                  console.log(error)
            }    
      }
})

const authenticateToken = (req,res,next)=>{
      const token = req.headers["x-acess-token"]
      if(!token) res.send("Missing Token")
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, user)=>{
            if(error) res.json([]) 
            req.user = user 
            next()
      })
}
// Read
app.get('/users', authenticateToken, async (req,res) =>{
      const users = await pool.query("SELECT  * FROM users")
      let userList = []
      users.rows.map((user)=>{
            userList.push({
                  name: user.name, 
                  email: user.email, 
                  role: user.role, 
                  id: user.user_id})
      })
      res.json(userList)
})
// Update
app.put("/user/:id", async (req,res) =>{
      try {
            const { id } = req.params
            const  { name, accessToken } = req.body
            console.log(name, accessToken )
            const updateUser = await pool.query("UPDATE users SET name = $1 WHERE user_id = $2 RETURNING *",[name,id])
            const updatedUser = {
                  name: updateUser.rows[0].name, 
                  email: updateUser.rows[0].email, 
                  role: updateUser.rows[0].role, 
                  id: updateUser.rows[0].user_id,
                  accessToken
            }
            res.json(updatedUser)
      } catch (error) {
          console.error(error)  
      }
})
// admin updating another user updating 
app.put("/users/:id", async (req,res) =>{
      try {
            const { id } = req.params
            const  { name } = req.body
            let newList = []
            const updateUser = await pool.query("UPDATE users SET name = $1 WHERE user_id = $2",[name,id])
            const users = await pool.query("SELECT * FROM users")
            users.rows.map((user)=>{
                  newList.push({
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        id: user.user_id
                  })
            })
            res.json(newList)
      } catch (error) {
          console.error(error)  
      }
})
// Delete
app.delete('/user/:id', async (req,res) =>{
      try {
            const { id } = req.params
            const delUser = await pool.query("DELETE FROM users WHERE user_id = $1", [id])
            res.json(null)
      } catch (error) {
            console.error(error)
      }
})

// admin deleting another user Delete  
app.delete('/users/:id', async (req,res) =>{
      try {
            const { id } = req.params
            const delUser = await pool.query("DELETE FROM users WHERE user_id = $1 RETURNING *", [id])
            let newList = []
            const users = await pool.query("SELECT * FROM users")
            users.rows.map((user)=>{
                  newList.push({
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        id: user.user_id
                  })
            })
            res.json(newList)
      } catch (error) {
            console.error(error)
      }
})



app.listen(PORT, () => console.log('Server started at port:' + PORT))