const express = require("express");
const twilio = require("twilio");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ─── CONFIG ───────────────────────────────────────────────
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER; // Your Twilio number
const BUSINESS_NAME = process.env.BUSINESS_NAME || "ATX Flow";
const CALLBACK_MINUTES = process.env.CALLBACK_MINUTES || "15";
// ──────────────────────────────────────────────────────────

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// Health check
app.get("/", (req, res) => {
  res.send(`✅ ${BUSINESS_NAME} SMS Automation is live.`);
});

// Twilio calls this when a call is missed
app.post("/missed-call", async (req, res) => {
  const callerNumber = req.body.From;
  const callStatus   = req.body.CallStatus;

  console.log(`📞 Incoming call from ${callerNumber} — status: ${callStatus}`);

  // Only fire SMS on no-answer or busy
  const missedStatuses = ["no-answer", "busy", "failed"];

  if (!missedStatuses.includes(callStatus)) {
    console.log("Call was answered — no SMS needed.");
    return res.status(200).send("OK");
  }

  if (!callerNumber) {
    console.log("No caller number found.");
    return res.status(400).send("Missing caller number");
  }

  const message = `Hey! You just called ${BUSINESS_NAME} and we missed you — we're with a customer right now but YOU are next. We'll call you back within ${CALLBACK_MINUTES} minutes. Don't go anywhere, you matter to us! 🙏 — ${BUSINESS_NAME}`;

  try {
    const sms = await client.messages.create({
      body: message,
      from: FROM_NUMBER,
      to: callerNumber,
    });

    console.log(`✅ SMS sent to ${callerNumber} — SID: ${sms.sid}`);
    res.status(200).send("SMS sent");
  } catch (err) {
    console.error("❌ Failed to send SMS:", err.message);
    res.status(500).send("SMS failed");
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 ${BUSINESS_NAME} automation running on port ${PORT}`);
});
