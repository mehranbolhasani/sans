import { google, type gmail_v1 } from "googleapis";

export function getGmailClient(accessToken: string): gmail_v1.Gmail {
  const oauth2 = new google.auth.OAuth2();
  oauth2.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth: oauth2 });
}
