const API_BASEURL = 'https://f5b24f79.ngrok.io'
const TWILIO_UPDATE_CALLER_ENDPOINT = `${API_BASEURL}/users/e26e3938-8a75-499c-9f45-40a750301993`
const TWILIO_CALL_TOKEN_ENDPOINT = `${API_BASEURL}/calls/token`
const TWILIO_GET_AVAILABLE_CALLEES_ENDPOINT = `${API_BASEURL}/calls`

async function initCall(calleeId) {
  try {
    console.log('in init call', calleeId)
    document.getElementById('callsDiv').style.display = "none";
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

function displayCalleeInfo(callee) {
  let callsDiv = document.getElementById("callsDiv")

  // Create header
  let h2 = document.createElement("H2");
  let h2text = document.createTextNode("These seniors are looking forward to chat with you")
  h2.appendChild(h2text)
  callsDiv.appendChild(h2)

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

    callees.forEach(callee => displayCalleeInfo(callee))
  } catch (err) {
    console.error(err)
  }
}

async function updateUserLanguages() {
  event.preventDefault()

  let languagesArray = ['english', 'tamil', 'mandarin', 'malay']
  let userLanguages = []
  languagesArray.forEach(language => {
    if (document.getElementById(language).checked) userLanguages.push(language)
  })

  await axios.post(TWILIO_UPDATE_CALLER_ENDPOINT, { 
    phone_number: "+65123456",
    user_type: "caller",
    languages: userLanguages
  })

  document.getElementById('languagesDiv').style.display = "none";

  await displayAvailableCallees()
}