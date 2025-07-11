const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const otps = {};

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false });

  const otp = generateOTP();
  otps[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  const msg = {
    to: email,
    from: process.env.FROM_EMAIL,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`,
    html: `<strong>Your OTP code is: ${otp}</strong>`
  };

  try {
    await sgMail.send(msg);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Send failed' });
  }
});

app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const record = otps[email];
  if (!record) return res.status(400).json({ success: false });
  if (Date.now() > record.expiresAt) {
    delete otps[email];
    return res.status(400).json({ success: false });
  }
  if (record.otp === otp) {
    delete otps[email];
    return res.json({ success: true });
  }
  res.status(400).json({ success: false });
});

app.get("/", (req, res) => {
  res.send("✅ OTP Server is running.");
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
