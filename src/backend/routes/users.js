// Imports
const express = require('express')
const router = express.Router()
const uuid = require('uuid/v4')
const _ = require('lodash')

// Env vars
const USERS_TABLE = process.env.USERS_TABLE

// AWS constants
const AWS = require('aws-sdk')
const AWS_REGION_NAME = 'ap-southeast-1'
AWS.config.update({region: AWS_REGION_NAME})
const docClient = new AWS.DynamoDB.DocumentClient()

async function getUser(req, res) {
  try {
    // TO-DO: Validate req
    const { user_id: userId } = req.params

    // Get user with userId from Users table
    const params = {
      TableName : USERS_TABLE,
      Key: {
        user_id: userId
      }
    };
    const response = await docClient.get(params).promise()
    const validUser = !_.isEmpty(response.Item)
    if (!validUser) throw new Error('User with callee_id was not found')

    const user = response.Item
    res.status(200).send({ user })
  } catch(err) {
    console.error(err)
    res.status(500).send(err.message)
  }
}

async function deleteUser(req, res) {
  try {
    // TO-DO: Validate req
    const { user_id: userId } = req.params

    // Delete user with userId from Users table
    const params = {
      TableName : USERS_TABLE,
      Key: {
        user_id: userId
      }
    };
    await docClient.delete(params).promise()
    res.status(200).send('Ok')
  } catch (err) {
    console.error(err)
    res.status(500).send(err.message)
  }
}

async function createUser(req, res) {
  try {
    // TO-DO: Validate req
    const { 
      phone_number: phoneNumber,
      languages: languages,
      user_type: userType,
      name,
      age
    } = req.body

    // Generate userId
    const userId = uuid()

    // Put user into Users table
    const params = {
      TableName : USERS_TABLE,
      Item: {
        user_id: userId,
        phone_number: phoneNumber,
        languages: languages,
        user_type: userType,
        name,
        age
      }
    };
    await docClient.put(params).promise()

    res.status(200).send({ user_id: userId })
  } catch (err) {
    console.error(err)
    res.status(500).send(err)
  }
}

async function updateUser(req, res) {
  try {
    // TO-DO: Validate req
    const { user_id: userId } = req.params
    const { 
      phone_number: phoneNumber,
      languages: languages,
      user_type: userType,
    } = req.body

    // Put user into Users table
    const params = {
      TableName : USERS_TABLE,
      Item: {
        user_id: userId,
        phone_number: phoneNumber,
        languages: languages,
        user_type: userType,
      }
    };
    // TO-DO: Use docClient.update
    await docClient.put(params).promise()

    res.status(200).send({ user_id: userId })
  } catch(err) {
    console.error(err)
    res.status(500).send(err)
  }
}

router.get('/:user_id', getUser)
router.delete('/:user_id', deleteUser)
router.post('/', createUser)
router.post('/:user_id', updateUser)

module.exports = router;