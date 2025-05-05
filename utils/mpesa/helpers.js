// utils/helpers.js
const dotenv = require('dotenv');

dotenv.config();

function generateBasicAuthToken() {
  const credentials = `${process.env.API_USERNAME}:${process.env.API_PASSWORD}`;
  const encodedCredentials = Buffer.from(credentials).toString('base64');
  return `Basic ${encodedCredentials}`;
}

const getAccessToken = async (MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET ) => {
  const auth = "Basic " + Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");

  const { data } = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: { Authorization: auth },
    }
  );
  return data.access_token;
};


function preparePhoneNumber(phoneNumber) {
  // Check if already in correct format
  if (/^2547\d{8}$/.test(phoneNumber)) {
    return phoneNumber;
  }

  // Convert 07XXXXXXXX to 2547XXXXXXXX
  if (/^07\d{8}$/.test(phoneNumber)) {
    return '254' + phoneNumber.slice(1);
  }

  throw new Error('Not a valid phone number format');
}

function generateInvoiceId(pkg_id) {
  const now = new Date();

  const yy = now.getFullYear().toString().slice(-2); // Last two digits of year
  const mm = String(now.getMonth() + 1).padStart(2, '0'); // Month (01–12)
  const dd = String(now.getDate()).padStart(2, '0'); // Day (01–31)
  const ss = String(now.getSeconds()).padStart(2, '0'); // Seconds (00–59)

  return `ETH_MPESA-${yy}${mm}${dd}${ss}`;
}

module.exports = {
  generateBasicAuthToken,
  preparePhoneNumber,
  generateInvoiceId,
  getAccessToken
};
