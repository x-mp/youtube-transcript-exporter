# Security Policy

## Supported Version

The current supported version is `1.1.0`.

## Data Handling

YouTube Transcript Exporter is a client-side Chrome extension. It does not include a backend service, external analytics, ads, tracking scripts, or remote data storage.

The extension reads YouTube page content only when the user requests an export and uses Chrome's Downloads API to save a local `.txt` file.

## Permissions

The extension requests:

- `downloads` to save the generated transcript file locally.
- Host access for `https://www.youtube.com/*` to read transcript text and visible video metadata from YouTube pages.

## Secret Handling

This repository should not contain:

- API keys
- GitHub tokens
- OAuth tokens
- Private SSH keys
- Passwords
- `.env` files
- Certificates or private key material

`.gitignore` excludes common local secret and environment files.

## Reporting A Security Issue

Open a GitHub issue with a clear description of the security concern. Do not include private tokens, passwords, or sensitive personal data in public issues.
