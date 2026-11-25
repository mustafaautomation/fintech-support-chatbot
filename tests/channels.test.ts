import { describe, expect, it } from "vitest";
import { acceptChannelMessage, readMessengerMessage, readWhatsAppMessage, verifyHub } from "@/lib/channels";
import { seedState } from "@/lib/demo";
import { SEEDED_PAN } from "@/lib/mask";

const whatsappPayload = {
  object: "whatsapp_business_account",
  entry: [
    {
      changes: [
        {
          value: {
            messages: [
              {
                from: "15551212000",
                id: "wamid.1",
                type: "text",
                text: { body: "What is the annual fee?" },
              },
            ],
          },
        },
      ],
    },
  ],
};

const messengerPayload = {
  object: "page",
  entry: [
    {
      messaging: [{ sender: { id: "USER_1" }, message: { text: `My card is ${SEEDED_PAN}. What is the annual fee?` } }],
    },
  ],
};

describe("channel adapters", () => {
  it("verifies a WhatsApp hub challenge and rejects a bad token", () => {
    const ok = verifyHub(new URL("https://lumen.test/api/channels/whatsapp?hub.mode=subscribe&hub.verify_token=lumen-verify&hub.challenge=abc123"), "lumen-verify");
    expect(ok).toEqual({ ok: true, challenge: "abc123" });
    const bad = verifyHub(new URL("https://lumen.test/api/channels/whatsapp?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=abc123"), "lumen-verify");
    expect(bad.ok).toBe(false);
  });

  it("maps a WhatsApp text message onto the core agent", () => {
    const inbound = readWhatsAppMessage(whatsappPayload);
    expect(inbound?.externalId).toBe("whatsapp:15551212000");
    const result = acceptChannelMessage(seedState(), inbound!);
    expect(result.reply).toContain("$0");
    expect(result.reply).not.toContain(SEEDED_PAN);
  });

  it("maps a Messenger message and masks a card number", () => {
    const inbound = readMessengerMessage(messengerPayload);
    expect(inbound?.text).toContain("···· 4419");
    expect(inbound?.text).not.toContain(SEEDED_PAN);
    const result = acceptChannelMessage(seedState(), inbound!);
    expect(result.reply).toContain("$0");
    expect(JSON.stringify(result)).not.toContain(SEEDED_PAN);
  });
});
