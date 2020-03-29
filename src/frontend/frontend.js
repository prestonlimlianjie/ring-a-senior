const API_BASEURL = 'http://localhost:3000'
const TWILIO_CALL_TOKEN_ENDPOINT = `${API_BASEURL}/calls/token`
const TWILIO_GET_AVAILABLE_CALLEES_ENDPOINT = `${API_BASEURL}/calls`

async function initCall(calleeId) {
  try {
    console.log('in init call')
    const resp = await axios.get(TWILIO_CALL_TOKEN_ENDPOINT)
    const { identity, token } = resp.data

    console.log(identity, token, 'token resp')

    Twilio.Device.setup(token);

    Twilio.Device.on('ready', function(device) {
      // The device is now ready
      console.log("Twilio.Device is now ready for connections");

      const connection = Twilio.Device.connect({callee_id: calleeId})

      console.log(connection, "conn")
    });
  } catch (err) {
    console.error(err)
  }
}

function displayCallInfo(callee) {
  let callsDiv = document.getElementById("callsDiv")

  // Create text info about callee
  let para = document.createElement("P");
  let text = document.createTextNode(`${callee.name}, ${callee.age}, ${callee.languages}`);
  para.appendChild(text);
  callsDiv.appendChild(para);

  // Create button
  let btn = document.createElement("BUTTON");
  btn.innerHTML = "Call";
  btn.addEventListener('click', () => initCall(callee.user_id));
  callsDiv.appendChild(btn); 
}

async function displayAvailableCallees() {
  try {
    const resp = await axios.get(TWILIO_GET_AVAILABLE_CALLEES_ENDPOINT)
    const { callees } = resp.data

    callees.forEach(callee => displayCallInfo(callee))
  } catch (err) {
    console.error(err)
  }
}

displayAvailableCallees()

// initCall()