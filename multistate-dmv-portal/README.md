# Multi-State DMV Wizard + Stripe Subscription

State document portal:
- Stripe subscriptions with a 7-day trial, then $19.99/mo, when Stripe keys are set
- Records wizard for marriage, divorce, death, property, your own bank records, criminal history, public court files, and Nevada motor-vehicle packets
- PDF packet generator (pdf-lib) with a cover sheet and instructions
- Static front end hosted on Netlify, with the API in Netlify Functions

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

## 3) Front-end and Netlify

`public/index.html` is the site:
- Renders the JSON Schema form for the selected state
- Generates PDFs in the browser as downloads
- Starts Stripe Checkout when billing is configured

From the repository root, with the Netlify CLI logged in:

```bash
npx netlify deploy --prod
```

`netlify.toml` publishes `multistate-dmv-portal/public` and bundles `netlify/functions/api.js`. Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET` in the Netlify UI when you are ready to charge. The packet builder works without them.

## 4) Security & compliance

- Set `ENFORCE_MEMBERSHIP=true` and replace `src/auth/requireActiveMembership.js` with your real auth check.
- Serve downloads via signed URLs in production.
- Encrypt and auto-purge generated packets within 30–60 days.
- Show clear disclaimer: private assistance service, not a government agency.
- Follow DPPA and state rules for motor-vehicle data; collect user authorization.

## 5) Replace placeholder PDFs

The `/templates/*` PDFs are placeholders for development only.
Replace with each state’s official blank forms before going live.
