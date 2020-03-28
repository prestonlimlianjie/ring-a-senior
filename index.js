// Imports
const express = require('express');
const cors = require('cors');
const _ = require('lodash');

// Env vars check
let requiredEnvVars = [
  'DYNAMODB_CONCURRENCY',
  // 'SCHEDULES_TABLE',
  // 'CALL_EVENTS_TABLE',
  'NODE_ENV',
  'PORT',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'USERS_TABLE'
]
let envVars = _.keys(process.env)
let missingEnvVars = _.difference(requiredEnvVars, envVars)
if (!_.isEmpty(missingEnvVars)) {
  throw new Error(`'Missing environment variables: ${_.toString(missingEnvVars)}`)
}

// Env vars
const PORT = process.env.PORT

const app = express();

// Import routes
const callsRouter = require('./routes/calls')
const usersRouter = require('./routes/users')

app.use(express.json({ limit: '10mb'}));
app.use(express.urlencoded({ extended: false }));

app.use(cors({
  'origin': '*',
  'credentials': true,
}))

// Protected routes
app.use('/users', usersRouter);
app.use('/calls', callsRouter);

module.exports = app;

// Main function of server
async function startServer () {
  try {
    app.listen(PORT, () => {
      console.log(`Example app listening on port ${PORT}!`)
    })
  } catch (err) {
    console.error(err)
    throw err
  }
}

// Initialize and start server
startServer()