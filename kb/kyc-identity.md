# Identity checks

Lumen's account opening, in the fictional world of this demo, collects legal name, date of birth, address, and a tax-id check. That full check already happened for Jordan Hale. This chat does not collect a social security number and does not accept a photo of an id.

Before the assistant reads transactions or changes the card, it asks for a one-time code. In this sandbox the code is printed on the demo page. A real bank would send that code to a device you already control. Pasting a full card number does not verify you, and the assistant masks any long card number it sees.

If the name you offer is not Jordan Hale, or the last four you offer is not 4419 or 8821, the check fails. After a match, actions in that chat apply to the seeded demo profile only.

The assistant will not confirm a full PAN, a full tax id, or a password. Those are not part of the chat.
