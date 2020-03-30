// Imports
const express = require('express')
const router = express.Router()
const _ = require('lodash')
const Bluebird = require('bluebird')
const moment = require('moment')

// Twilio constants
const twilio = require('twilio')
const VoiceResponse = twilio.twiml.VoiceResponse;
const ClientCapability = twilio.jwt.ClientCapability;

// Env vars
const TWILIO_APP_SID = process.env.TWILIO_APP_SID
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER
const USERS_TABLE = process.env.USERS_TABLE
const SCHEDULES_TABLE = process.env.SCHEDULES_TABLE
const CALL_EVENTS_TABLE = process.env.CALL_EVENTS_TABLE

// AWS constants
const AWS = require('aws-sdk')
const AWS_REGION_NAME = 'ap-southeast-1'
AWS.config.update({region: AWS_REGION_NAME})
const docClient = new AWS.DynamoDB.DocumentClient()

// Hardcoded constants
const MY_USER_ID = 'e26e3938-8a75-499c-9f45-40a750301993'

async function getAvailableCallees(req, res) {
  try {
    // TO-DO: Obtain userId from JWT and remove hardcoding
    const userId = MY_USER_ID

    // 1. Obtain the languages that the caller can speak
    const getUserParams = {
      TableName : USERS_TABLE,
      Key: {
        user_id: userId
      }
    };
    const getUserResponse = await docClient.get(getUserParams).promise()
    const validUser = !_.isEmpty(getUserResponse.Item) && getUserResponse.Item.user_type === 'caller'
    if (!validUser) throw new Error('User with caller_id was not found')
    const callerLanguages = getUserResponse.Item.languages

    // 2. Retrieve all available callees in Schedules table for this current hour
    const queryScheduleParams = {
      TableName: SCHEDULES_TABLE,
      KeyConditionExpression: '#date = :date',
      ExpressionAttributeValues: {
        ':date': moment(new Date()).format('DD-MM-YYYY')
      },
      ExpressionAttributeNames: {
        '#date': 'date'
      }
    }
    const queryScheduleResponse = await docClient.query(queryScheduleParams).promise()
    const currentHour = new Date().getHours().toString()
    const schedules = _.filter(queryScheduleResponse.Items, (scheduleObj => scheduleObj.schedule.includes(currentHour)))

    // 3. Using the callee_ids, check if the callees can speak the same language as the caller.
    //    If they speak the same language, proceed.
    const sameLanguageCallees = await Bluebird.map(schedules, async (schedule) => {
      try {
        const calleeId = schedule.user_id
        const getCalleeParams = {
          TableName : USERS_TABLE,
          Key: {
            user_id: calleeId
          }
        };
        const getCalleeResponse = await docClient.get(getCalleeParams).promise()

        // Checks
        // 1. response.Item is not empty
        // 2. user_type is callee
        // 3. there is at least 1 common language between caller and callee
        const validCallee = !_.isEmpty(getCalleeResponse.Item) 
          && getCalleeResponse.Item.user_type === 'callee'
          && _.intersection(getCalleeResponse.Item.languages, callerLanguages).length > 0

        if (validCallee) return {
          ...getCalleeResponse.Item,
          phone_number: undefined
        }
      } catch (err) {
        throw err
      }
    })
    const compactSameLanguageCallees = _.compact(sameLanguageCallees)

    // 4. Check if these callees are already in existing calls right now by looking in the Call Events table.
    // TO-DO

    res.status(200).send({ callees: compactSameLanguageCallees })
  } catch(err) {
    console.error(err)
    res.status(500).send(err.message)
  }
}

async function getCallToken(req, res) {
  const identity = 'Yo Mama';

  const capability = new ClientCapability({
    accountSid: TWILIO_ACCOUNT_SID,
    authToken: TWILIO_AUTH_TOKEN,
  });

  // Add scope to allow Twilio Device to make outgoing calls
  capability.addScope(new ClientCapability.OutgoingClientScope({
    applicationSid: TWILIO_APP_SID,
    clientName: identity,
  }));

  // Include identity and token in a JSON response
  const response = {
    identity: identity,
    token: capability.toJwt(),
  };

  return res.status(200).send(response)
}

async function initiateCall(req, res) {
  try {
    // 1. Get callee_id from request body
    const { callee_id: calleeId } = req.body

    // 2. Validate callee_id in Users table
    const params = {
      TableName : USERS_TABLE,
      Key: {
        user_id: calleeId
      }
    };
    const response = await docClient.get(params).promise();
    const validUser = !_.isEmpty(response.Item)
    if (!validUser) throw new Error('User with callee_id was not found')

    const callee = response.Item

    // 3. Get phone number of callee
    const phoneNumber = callee.phone_number

    // 4. Respond wih TwiML instruction for Twilio to call phoneNumber using callerId
    const twiml = new VoiceResponse();
    const dial = twiml.dial({callerId : TWILIO_PHONE_NUMBER});
    dial.number(phoneNumber)

    res.send(twiml.toString());

  } catch (err) {
    console.error(err)
    res.status(400).send(err)
  }
}

router.get('/', getAvailableCallees)
router.get('/token', getCallToken)
router.post('/', twilio.webhook({validate: false}), initiateCall)

module.exports = router;