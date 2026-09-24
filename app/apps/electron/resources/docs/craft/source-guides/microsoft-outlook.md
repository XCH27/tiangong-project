# Outlook

Access to Microsoft Outlook email via the Microsoft Graph API.

## Scope

*   Read, send, and manage emails
*   Access mail folders (Inbox, Sent, Drafts, etc.)
*   Search messages
*   Manage attachments

## Common Endpoints

### List Messages

```plaintext
GET /me/messages
```

Query params: `$top`, `$skip`, `$filter`, `$orderby`, `$select`

### Get a Message

```plaintext
GET /me/messages/{id}
```

### Search Messages

```plaintext
GET /me/messages?$search="keyword"
```

### List Mail Folders

```plaintext
GET /me/mailFolders
```

### Send Email

```plaintext
POST /me/sendMail
Body: {
  "message": {
    "subject": "...",
    "body": { "contentType": "Text", "content": "..." },
    "toRecipients": [{ "emailAddress": { "address": "..." } }]
  }
}
```

## Guidelines

*   Use the `api_outlook` tool with `path`, `method`, and optional `params`
*   Base URL: `https://graph.microsoft.com/v1.0`
*   All paths are relative to the base URL

* * *

## Setup Guide

### Configuration

**Required config.json:**

```json
{
  "name": "Outlook",
  "slug": "outlook",
  "enabled": true,
  "provider": "microsoft",
  "type": "api",
  "api": {
    "baseUrl": "https://graph.microsoft.com/v1.0/",
    "authType": "bearer",
    "microsoftService": "outlook",
    "testEndpoint": {
      "method": "GET",
      "path": "me/mailFolders?$top=1"
    }
  },
  "iconUrl": "https://res.cdn.office.net/files/fabric-cdn-prod_20241209.001/assets/brand-icons/product/svg/outlook_48x1.svg"
}
```

### Authentication

Use `source_microsoft_oauth_trigger` to start the Microsoft OAuth flow.

### Rate Limits

Microsoft Graph has throttling limits. If you receive 429 errors, wait before retrying.
