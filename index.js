const express = require("express");
const axios = require("axios");
require('dotenv').config()

const app = express();
app.use(express.json());

const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, PORT } = process.env;
const messages = [];

app.post("/webhook", async (req, res) => {

  console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

  const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];

  if (message?.type === "text") {
    const business_phone_number_id =
      req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

      // Store incoming message
    messages.push({
      type: "incoming",
      from: message.from,
      text: message.text.body,
      timestamp: new Date().toLocaleString()
    });

    // Response message
    const responseMessage = {
      type: "outgoing",
      to: message.from,
      text: "Hi.. I'm TJ",
      timestamp: new Date().toLocaleString()
    };

    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        "Content-Type": 'application/json'
      },
      data: {
        messaging_product: "whatsapp",
        to: message.from,
        text: { body: "Hi.. I'm TJ" },
        context: {
          message_id: message.id,
        },
      },
    });

    // Store outgoing message
    messages.push(responseMessage);

    // await axios({
    //   method: "POST",
    //   url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
    //   headers: {
    //     Authorization: `Bearer ${GRAPH_API_TOKEN}`,
    //     "Content-Type": 'application/json'
    //   },
    //   data: {
    //     messaging_product: "whatsapp",
    //     status: "read",
    //     message_id: message.id,
    //   },
    // });
  }

  res.sendStatus(200);
});

app.get("/messages", (req, res) => {
  res.json(messages);
});

app.get("/messages-text", (req, res) => {
  const formattedMessages = messages
    .map(msg => `${msg.type.toUpperCase()} - ${msg.type === "incoming" ? "From" : "To"}: ${msg.type === "incoming" ? msg.from : msg.to} | ${msg.text} | ${msg.timestamp}`)
    .join("\n");

  res.set("Content-Type", "text/plain");
  res.send(formattedMessages);
});


app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
    console.log("Webhook verified successfully!");
  } else {
    res.sendStatus(403);
  }
});

app.get("/", (req, res) => {
  res.send(`<pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});



app.listen(PORT, () => {
  console.log(`Server is a listening on port: ${PORT}`);
});