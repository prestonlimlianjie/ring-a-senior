// Imports
const express = require('express');
const router = express.Router();
const _ = require('lodash')

// Twilio constants
const twilio = require('twilio');
const VoiceResponse = twilio.twiml.VoiceResponse;
const ClientCapability = twilio.jwt.ClientCapability;

// Env vars
const TWILIO_APP_SID = process.env.TWILIO_APP_SID
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER
const USERS_TABLE = process.env.USERS_TABLE

// AWS constants
const AWS = require('aws-sdk');
const AWS_REGION_NAME = 'ap-southeast-1'
AWS.config.update({region: AWS_REGION_NAME})
const docClient = new AWS.DynamoDB.DocumentClient();

async function getAvailableCallees(req, res) {
  try {
    // 1. Obtain the languages that the caller can speak
    // 2. Retrieve all available callees in Schedules table for this current hour and next hour.
    // 3. Using the callee_ids, check if the callees can speak the same language as the caller.
    //    If they speak the same language, proceed.
    // 4. Check if these callees are already in existing calls right now by looking in the Call Events table.
  } catch(err) {

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