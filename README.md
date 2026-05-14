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
Timestamp | Name | Email | Neighborhood | Interests | Message | Follow-up Status | Source | Referrer
```

Configure these Netlify environment variables:

```text
GOOGLE_SHEETS_SPREADSHEET_ID=the spreadsheet id from the Google Sheets URL
GOOGLE_SHEETS_SHEET_NAME=Supporters
GOOGLE_SHEETS_CLIENT_EMAIL=the service account email
GOOGLE_SHEETS_PRIVATE_KEY=the service account private key, including BEGIN/END PRIVATE KEY
```

Then share the Google Sheet with the service account email as an editor. The visitor-facing form stays on the website; the service account is only used by the server-side Netlify Function.

## Tone

The site should remain collaborative and non-adversarial. It should not shame SDUHSD, SDA, the school board, or the City of Encinitas.
