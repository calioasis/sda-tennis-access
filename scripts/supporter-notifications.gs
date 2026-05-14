const SUPPORTERS_SHEET_NAME = "Supporters";
const NOTIFICATION_TO = "jeffrey.sherin@gmail.com";

function notifyNewSupporters() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SUPPORTERS_SHEET_NAME);

  if (!sheet) {
    throw new Error(`Missing sheet: ${SUPPORTERS_SHEET_NAME}`);
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 14).getValues();

  values.forEach((row, index) => {
    const rowNumber = index + 2;
    const [
      timestamp,
      name,
      email,
      neighborhood,
      interests,
      message,
      followUpStatus,
      source,
      referrer,
      notes,
      lastContacted,
      owner,
      notificationSentAt
    ] = row;

    if (!timestamp || notificationSentAt) {
      return;
    }

    try {
      const subject = `New SDA Tennis Access signup: ${name || email}`;
      const body = [
        "New SDA Tennis Access signup",
        "",
        `Name: ${name || "Not provided"}`,
        `Email: ${email || "Not provided"}`,
        `Neighborhood: ${neighborhood || "Not provided"}`,
        `Interests: ${interests || "Not provided"}`,
        `Follow-up Status: ${followUpStatus || "New"}`,
        `Source: ${source || "Website"}`,
        `Referrer: ${referrer || "Not provided"}`,
        "",
        "Message:",
        message || "Not provided",
        "",
        "Notes:",
        notes || "None",
        "",
        "Last Contacted:",
        lastContacted || "Not contacted",
        "",
        "Owner:",
        owner || "Unassigned",
        "",
        "Campaign tracker:",
        spreadsheet.getUrl()
      ].join("\n");

      MailApp.sendEmail({
        to: NOTIFICATION_TO,
        replyTo: email || "",
        subject,
        body
      });

      sheet.getRange(rowNumber, 13).setValue(new Date());
      sheet.getRange(rowNumber, 14).clearContent();
    } catch (error) {
      sheet.getRange(rowNumber, 14).setValue(error.message);
    }
  });
}

function installSupporterNotificationTrigger() {
  ScriptApp.newTrigger("notifyNewSupporters")
    .timeBased()
    .everyMinutes(5)
    .create();
}
