# Multi-State DMV Wizard + Stripe Subscription

Production-ready starter for a state document portal:
- Stripe subscriptions with 7‑day trial → $19.99/mo
- DMV Records Wizard using a 50‑state adapter pattern
- PDF packet generator (pdf-lib) with cover sheet + instructions
- Simple demo front-end you can copy into your Manus site

## 1) Quick start

```bash
npm install
cp .env.example .env   # fill in Stripe keys & price id
npm start
# open http://localhost:3001
```

**Environment variables**
- `CLIENT_URL` — your Manus front-end origin
- `STRIPE_SECRET_KEY` — your Stripe secret key (start with TEST)
- `STRIPE_PRICE_ID` — monthly $19.99 price with 7-day trial (create in Stripe dashboard)
- `STRIPE_WEBHOOK_SECRET` — from Stripe → Developers → Webhooks
- `PORT` — default 3001

**Stripe Webhook**
Create endpoint: `/api/billing/webhook` and subscribe to:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- (optional) `customer.subscription.trial_will_end`

Update your database in the webhook handler (stubs provided).

## 2) Multi-state DMV wizard

Each state is an adapter in `src/states/` that specifies:
- Forms and fill mapping (`overlay` or `acroform`)
- Fees and submission channel (mail or portal)
- Required documents and notes
- JSON schema for the wizard fields per request type

Add a new state in minutes:
1. Copy `src/states/template.js` → `src/states/CA.js` (example).
2. Drop official blank PDFs in `/templates/CA/`.
3. Register the state in `src/states/index.js`.

**Demo routes**
- `GET /api/dmv/schema/:state/:type` → JSON Schema to render the form
- `POST /api/dmv/generate/:state/:type` → returns file URLs + next steps

## 3) Front-end

See `public/index.html` for a drop-in demo:
- Start free trial with Stripe Checkout
- Render JSON Schema form for the selected state
- Generate PDFs and show download links + instructions

## 4) Security & compliance

- Replace `src/auth/requireActiveMembership.js` with your real auth check.
- Serve downloads via signed URLs in production.
- Encrypt and auto-purge generated packets within 30–60 days.
- Show clear disclaimer: private assistance service, not a government agency.
- Follow DPPA and state rules for motor-vehicle data; collect user authorization.

## 5) Replace placeholder PDFs

The `/templates/*` PDFs are placeholders for development only.
Replace with each state’s official blank forms before going live.
