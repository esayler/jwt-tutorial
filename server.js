const dotenv = require('dotenv')
const express = require('express')
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

dotenv.config()

if (
  !process.env.CLIENT_SECRET ||
  !process.env.USERNAME ||
  !process.env.PASSWORD
) {
  throw 'Make sure you have a CLIENT_SECRET, USERNAME, and PASSWORD in your .env file'
}

app.set('secretKey', process.env.CLIENT_SECRET)

app.locals.trains = [
  { id: 1, line: 'green', status: 'running' },
  { id: 2, line: 'blue', status: 'delayed' },
  { id: 3, line: 'red', status: 'down' },
  { id: 4, line: 'orange', status: 'maintenance' },
]

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())

const checkAuth = (req, res, next) => {
  const token =
    req.body.token || req.param('token') || req.headers['authorization']

  if (token) {
    jwt.verify(token, app.get('secretKey'), (error, decoded) => {
      if (error) {
        return res.status(403).json({
          success: false,
          message: 'Invalid authorization token.',
        })
      } else {
        req.decoded = decoded
        next()
      }
    })
  } else {
    return res.status(403).json({
      success: false,
      message: 'You must be authorized to hit this endpoint',
    })
  }
}

app.post('/authenticate', (req, res) => {
  const user = req.body

  if (
    user.username !== process.env.USERNAME ||
    user.password !== process.env.PASSWORD
  ) {
    res.status(403).json({
      success: false,
      message: 'Invalid Credentials',
    })
  } else {
    let token = jwt.sign(user, app.get('secretKey'), {
      expiresIn: 172800,
    })

    res.json({
      success: true,
      username: user.username,
      token: token,
    })
  }
})

app.get('/api/v1/trains', (req, res) => {
  res.json(app.locals.trains)
})

app.patch('/api/v1/trains/:id', checkAuth, (req, res) => {
  const { train } = req.body
  const { id } = req.params
  const index = app.locals.trains.findIndex(m => m.id == id)

  if (index === -1) {
    return res.sendStatus(404)
  }

  const originalTrain = app.locals.trains[index]
  app.locals.trains[index] = Object.assign(originalTrain, train)

  return res.json(app.locals.trains)
})


app.listen(3001)
console.log('Listening on http://localhost:3001')
