# State Docs

A private assistant for getting official records when a state or county website will not finish the order.

It covers all 50 states, the District of Columbia, and New York City. Birth, death, marriage, divorce, adoption, and your own driver record each have a mail path. California counties include the clerk-recorder mailing desk.

## What it does

- Builds a signed-request letter that lists every name the record may be filed under: the name you use now, the name at the event, and earlier names from marriage, divorce, adoption, or a court order.
- Addresses the state office and, when the county keeps the record or publishes a mailing desk, the county clerk too.
- Prints a checklist and an envelope sheet.
- Links the official page and the office phone, including the path of calling and asking them to mail their own form.
- For a sealed pre-adoption birth record, asks for the current certificate and for the office's written legal process. It does not bypass a court seal.

State Docs is not a government agency. The office that keeps the record decides whether to release it. Confirm the fee on the official page before you mail a check.

## Run

```bash
cd multistate-dmv-portal
npm install
npm test
npm start
```

Open http://localhost:3001

Record packets do not require a subscription. Stripe checkout is optional and stays off until `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, and `CLIENT_URL` are set in `.env`.

Mailing addresses follow the 2026 Where-to-Write listings used by county recorders. Fees and hours change.
