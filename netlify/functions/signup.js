const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  },
  body: JSON.stringify(body)
});

const base64UrlEncode = (input) => Buffer.from(input)
  .toString("base64")
  .replace(/=/g, "")
  .replace(/\+/g, "-")
  .replace(/\//g, "_");

const normalizePrivateKey = (privateKey) => privateKey.replace(/\\n/g, "\n");

const importPrivateKey = async (privateKey) => {
  const pem = normalizePrivateKey(privateKey)
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binary = Buffer.from(pem, "base64");

  return crypto.subtle.importKey(
    "pkcs8",
    binary,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );
};

const createJwt = async ({ clientEmail, privateKey }) => {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: clientEmail,
    scope: GOOGLE_SHEETS_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now
  };

  const unsignedToken = [
    base64UrlEncode(JSON.stringify(header)),
    base64UrlEncode(JSON.stringify(claim))
  ].join(".");

  const key = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    Buffer.from(unsignedToken)
  );

  return `${unsignedToken}.${base64UrlEncode(Buffer.from(signature))}`;
};

const getAccessToken = async ({ clientEmail, privateKey }) => {
  const assertion = await createJwt({ clientEmail, privateKey });
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!response.ok) {
    throw new Error(`Google auth failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
};

const parseFormBody = (event) => {
  const contentType = event.headers["content-type"] || event.headers["Content-Type"] || "";

  if (contentType.includes("application/json")) {
    return JSON.parse(event.body || "{}");
  }

  const params = new URLSearchParams(event.body || "");
  const interests = params.getAll("interests");

  return {
    name: params.get("name") || "",
    email: params.get("email") || "",
    neighborhood: params.get("neighborhood") || "",
    message: params.get("message") || "",
    botField: params.get("bot-field") || "",
    interests
  };
};

const cleanText = (value, maxLength = 1200) => String(value || "")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, maxLength);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || "Supporters";

  if (!spreadsheetId || !clientEmail || !privateKey) {
    return jsonResponse(500, { error: "Signup service is not configured" });
  }

  try {
    const form = parseFormBody(event);

    if (form.botField) {
      return jsonResponse(200, { ok: true });
    }

    const name = cleanText(form.name, 160);
    const email = cleanText(form.email, 240);
    const neighborhood = cleanText(form.neighborhood, 160);
    const message = cleanText(form.message, 3000);
    const interests = Array.isArray(form.interests)
      ? form.interests.map((interest) => cleanText(interest, 120)).filter(Boolean)
      : [cleanText(form.interests, 120)].filter(Boolean);

    if (!name || !isValidEmail(email)) {
      return jsonResponse(400, { error: "Name and a valid email are required" });
    }

    const accessToken = await getAccessToken({ clientEmail, privateKey });
    const range = encodeURIComponent(`${sheetName}!A:I`);
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const values = [[
      new Date().toISOString(),
      name,
      email,
      neighborhood,
      interests.join(", "),
      message,
      "New",
      "Website",
      event.headers.referer || "https://sdatennisaccess.org/"
    ]];

    const appendResponse = await fetch(appendUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ values })
    });

    if (!appendResponse.ok) {
      throw new Error(`Google Sheets append failed: ${appendResponse.status}`);
    }

    return jsonResponse(200, { ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse(500, { error: "Signup could not be saved" });
  }
};
