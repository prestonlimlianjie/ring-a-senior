// Imports
const express = require('express')
const router = express.Router()
const _ = require('lodash')
const moment = require('moment')

// Env vars
const USERS_TABLE = process.env.USERS_TABLE
const SCHEDULES_TABLE = process.env.SCHEDULES_TABLE

// AWS constants
const AWS = require('aws-sdk')
const AWS_REGION_NAME = 'ap-southeast-1'
AWS.config.update({region: AWS_REGION_NAME})
const docClient = new AWS.DynamoDB.DocumentClient()

async function getSchedule(req, res) {
  try {
    // TO-DO: Validate req
    const { user_id: userId } = req.params

    // Get schedule from Schedules table
    const params = {
      TableName: SCHEDULES_TABLE,
      KeyConditionExpression: 'user_id = :userId and #date = :date',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':date': moment(new Date()).format('DD-MM-YYYY')
      },
      ExpressionAttributeNames: {
        '#date': 'date'
      }
    }
    const response = await docClient.query(params).promise()
    const validSchedule = !_.isEmpty(response.Items[0])
    if (!validSchedule) throw new Error(`Schedule for user_id ${userId} was not found`)

    const schedule = response.Items[0]
    res.status(200).send({ schedule })
  } catch (err) {
    console.error(err)
    res.status(500).send(err.message)
  }
}

async function createSchedule(req, res) {
  try {
    // TO-DO: Validate req
    const { user_id: userId } = req.params
    const { schedule } = req.body

    // Verify that user exists and is a callee
    const getUserParams = {
      TableName : USERS_TABLE,
      Key: {
        user_id: userId
      }
    };
    const response = await docClient.get(getUserParams).promise()
    const validUser = !_.isEmpty(response.Item) && response.Item.user_type === 'callee'
    if (!validUser) throw new Error('User with callee_id was not found')

    // Put schedule
    const putScheduleParams = {
      TableName : SCHEDULES_TABLE,
      Item: {
        user_id: userId,
        date: moment(new Date()).format('DD-MM-YYYY'),
        schedule
      }
    };
    await docClient.put(putScheduleParams).promise()

    res.status(200).send('Ok')
  } catch (err) {
    console.error(err)
    res.status(500).send(err)
  }
}

router.get('/:user_id', getSchedule)
router.post('/:user_id', createSchedule)
// router.get('/', getAllSchedules)

module.exports = router;