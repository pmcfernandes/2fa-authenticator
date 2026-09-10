# 2FA Authenticator

A desktop two-factor authentication app for Windows, macOS, and Linux, built with Tauri, React, and Vite. It works like Google Authenticator: add accounts, view live TOTP codes, copy codes, and keep secrets stored locally on your machine.

## Features

- Live TOTP codes with countdown timers
- Add accounts by webcam QR scan
- Add accounts by uploading a QR image
- Manual account entry with Base32 secret support
- Search saved accounts
- Copy codes to the system clipboard
- Confirm before deleting an account
- Encrypted import and export using password-protected `.2fa` backup files
- Local encrypted persistence using Tauri commands, AES-GCM, and the operating system keyring
- Light and dark mode with a clean black-and-white design
- Multi-language support: English, French, Spanish, Portuguese, and German
- App lock with password protection

## Tech Stack

- Rust command handlers for local persistence, file dialogs, and clipboard access
- Tauri 2
- React 18
- Vanilla CSS and Lucide React icons
- `otpauth` for TOTP generation and `otpauth://` URI parsing
- `@yudiel/react-qr-scanner` for webcam QR scanning
- `jsqr` for QR decoding from uploaded images

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

Create a desktop app bundle:

```bash
npm run dist
```

The generated bundles are written under:

```text
src-tauri/target/release/bundle
```

Platform-specific bundles must be built on their target platform.

## Requirements

- Node.js and npm
- Rust and Cargo
- Tauri platform prerequisites for your operating system

After changing dependencies, run `npm install` to refresh `package-lock.json`.

## Security Notes

Account secrets are stored locally and encrypted with AES-GCM. The account encryption key is stored in the operating system keyring. Exported backups are encrypted with AES-GCM using a key derived from the export password.

This app does not sync data to a server. Keep your backup password safe, because encrypted backups cannot be restored without it.
