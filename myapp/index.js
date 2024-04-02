const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'goodreads.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

// Get Books API
app.get('/books/', async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`
  const booksArray = await db.all(getBooksQuery)
  response.send(booksArray)
})

//Create User API

const bcrypt = require('bcrypt')

app.post('/users/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    // Create user in User Table
    const createUser = `INSERT INTO user (username, name, password, gender, location) VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}') ;`
    await db.run(createUser)
    response.send('user created sucessfull')
  } else {
    //Send invalid user as response
    response.status(400)
    response.send('Username already exists')
  }
})

//User Login API

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPasswordMacth = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMacth === true) {
      response.send('Login Sucess')
    } else {
      response.status(400)
      response.send('Invalid Password')
    }
  }
})
