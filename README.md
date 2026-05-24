# 2FA Authenticator

A desktop two-factor authentication app for Windows, built with Electron, React, and Vite. It works like Google Authenticator: add accounts, view live TOTP codes, copy codes, and keep secrets stored locally on your machine.

## Features

- Live TOTP codes with countdown timers
- Add accounts by webcam QR scan
- Add accounts by uploading a QR image
- Manual account entry with Base32 secret support
- Search saved accounts
- Copy codes to the Windows clipboard
- Confirm before deleting an account
- Encrypted import and export using password-protected `.2fa` backup files
- Local encrypted persistence using Electron `safeStorage` and `electron-store`
- Dark mode UI with simple blue accents

## Tech Stack

- Electron with `electron-vite`
- React 18
- `otpauth` for TOTP generation and `otpauth://` URI parsing
- `@yudiel/react-qr-scanner` for webcam QR scanning
- `jsqr` for QR decoding from uploaded images
- `electron-store` and Electron `safeStorage` for local persistence
- Vanilla CSS and Lucide React icons

## Development

Install dependencies:

```bash
npm install
```

Run the app in development mode:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```

Create a Windows installer:

```bash
npm run dist
```

The installer is generated in:

```text
release/2FA Authenticator-1.0.0-Setup.exe
```

An unpacked executable is also generated in:

```text
release/win-unpacked/2FA Authenticator.exe
```

## Security Notes

Account secrets are stored locally and protected with Electron `safeStorage` when available. Exported backups are encrypted with AES-GCM using a key derived from the export password.

This app does not sync data to a server. Keep your backup password safe, because encrypted backups cannot be restored without it.
