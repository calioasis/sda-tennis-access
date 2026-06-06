# SDA Tennis Access

A simple static website for sharing information about increasing community access to San Dieguito Academy tennis courts through a joint-use agreement.

## Purpose

This site is intended to be positive, factual, and constructive. It summarizes nearby joint-use models and provides downloadable example agreements.

## Local development

Open `index.html` directly in a browser.

## Suggested file structure

```text
index.html
style.css
README.md
CNAME
netlify.toml
images/
  sda-courts-map.png
downloads/
  mission-bay-high-school-jua.pdf
  city-cusd-jua-dec-2023.pdf
```

## Deployment

This is a static site and can be deployed to Netlify, GitHub Pages, Cloudflare Pages, or any static host.

Recommended setup: publish the GitHub repository through Netlify and connect `SDATennisAccess.org` as the custom domain. Netlify will deploy automatically whenever changes are pushed to the main branch.

## Signup Form Backend

The `Get involved` form posts to a Netlify Function at `/.netlify/functions/signup`. The function appends submissions to a Google Sheet using a Google Cloud service account.

Create a tab named `Supporters` in the target spreadsheet with these headers:

```text
Timestamp | Name | Email | Neighborhood | Interests | Message | Follow-up Status | Source | Referrer | Notes | Last Contacted | Owner | Notification Sent At | Notification Error
```

Configure these Netlify environment variables:

```text
GOOGLE_SHEETS_SPREADSHEET_ID=the spreadsheet id from the Google Sheets URL
GOOGLE_SHEETS_SHEET_NAME=Supporters
GOOGLE_SHEETS_CLIENT_EMAIL=the service account email
GOOGLE_SHEETS_PRIVATE_KEY=the service account private key, including BEGIN/END PRIVATE KEY
```

Then share the Google Sheet with the service account email as an editor. The visitor-facing form stays on the website; the service account is only used by the server-side Netlify Function.

Optional email notifications use Resend. Configure these additional Netlify environment variables after creating a Resend API key:

```text
RESEND_API_KEY=the Resend API key
SIGNUP_NOTIFICATION_TO=the email address that should receive signup alerts
SIGNUP_NOTIFICATION_FROM=SDA Tennis Access <updates@your-verified-domain>
```

Resend requires the `SIGNUP_NOTIFICATION_FROM` domain to be verified for production sending. Without these variables, signups still save to the Google Sheet; only email alerts are skipped.

Each saved signup records notification delivery status in the spreadsheet. `Notification Sent At` is filled when the Netlify Function sends an email successfully. `Notification Error` is filled when email notification is not configured or fails.

Alternatively, use the Google Apps Script in `scripts/supporter-notifications.gs` to send notifications from the spreadsheet itself. In the campaign tracker, open Extensions > Apps Script, paste the script, run `installSupporterNotificationTrigger`, and approve permissions. The script checks the `Supporters` tab every five minutes, emails new rows, and writes `Notification Sent At`.

## Tone

The site should remain collaborative and non-adversarial. It should not shame SDUHSD, SDA, the school board, or the City of Encinitas.
