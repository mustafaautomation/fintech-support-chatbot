# Channel adapters

WhatsApp and Messenger both call the same core agent as the website chat. With no `GROQ_API_KEY` or `GEMINI_API_KEY`, that agent is the offline demo engine.

## WhatsApp Cloud API

Webhook URL: `https://fintech-chat.quvantic.com/api/channels/whatsapp`

Verify token: `WHATSAPP_VERIFY_TOKEN` (local default `lumen-verify`).

Meta sends a GET with `hub.mode`, `hub.verify_token`, and `hub.challenge`. A matching token returns the challenge. Text messages are read from `entry[].changes[].value.messages[]` and answered by the core agent. This demo returns the reply in the webhook JSON. It does not call the Graph API unless you add that send yourself. No paid Lumen service is required.

Sample body:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              { "from": "15551212000", "id": "wamid.1", "type": "text", "text": { "body": "What is the annual fee?" } }
            ]
          }
        }
      ]
    }
  ]
}
```

## Facebook Messenger

Webhook URL: `https://fintech-chat.quvantic.com/api/channels/messenger`

Verify token: `MESSENGER_VERIFY_TOKEN` (local default `lumen-verify`).

Sample body:

```json
{
  "object": "page",
  "entry": [
    {
      "messaging": [
        { "sender": { "id": "USER_ID" }, "message": { "text": "What is the annual fee?" } }
      ]
    }
  ]
}
```

Card numbers in either payload are masked before they are stored or logged.
