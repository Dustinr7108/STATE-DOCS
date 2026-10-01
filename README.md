# State Docs

Help for people who need a birth, marriage, divorce, death, adoption, or driver record and cannot finish the order online.

The working app is in [`multistate-dmv-portal`](multistate-dmv-portal).

```bash
cd multistate-dmv-portal
npm install
npm test
npm start
```

Then open http://localhost:3001

Every state has a mail path. Name changes from marriage, divorce, adoption, and court orders are written into the request so the clerk can search the name on the record, not only the name on a current ID. If a county has no online service, the packet is addressed to that county clerk. California includes mailing desks for all 58 counties.

This is a private assistance service, not a government agency.
