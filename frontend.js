const TWILIO_CALL_TOKEN_ENDPOINT = "https://e08ba1b1.ngrok.io/calls/token"
const CALLEE_ID = "preston"

async function initCall() {
  try {
    console.log('in init call')
    const resp = await axios.get(TWILIO_CALL_TOKEN_ENDPOINT)
    const { identity, token } = resp.data

    console.log(identity, token, 'token resp')

    Twilio.Device.setup(token);

    Twilio.Device.on('ready', function(device) {
      // The device is now ready
      console.log("Twilio.Device is now ready for connections");

      const connection = Twilio.Device.connect({callee_id: CALLEE_ID})

      console.log(connection, "conn")
    });
  } catch (err) {
    console.log(err)
  }
}

initCall()