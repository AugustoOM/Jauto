# Desktop release process

Jauto publishes Windows x64 and universal macOS installers from `.github/workflows/desktop-release.yml`. A release is created only after dependency audit, lint, tests, type checks, web and desktop frontend builds, native builds, installer smoke tests, and all applicable signature checks succeed.

## Optional repository secrets

- `WINDOWS_CERTIFICATE`: base64-encoded PFX Authenticode certificate.
- `WINDOWS_CERTIFICATE_PASSWORD`: PFX password.
- `APPLE_CERTIFICATE`: base64-encoded Developer ID Application PKCS#12 certificate.
- `APPLE_CERTIFICATE_PASSWORD`: PKCS#12 and temporary keychain password.
- `APPLE_SIGNING_IDENTITY`: full Developer ID Application identity.
- `APPLE_ID`: Apple developer account email.
- `APPLE_PASSWORD`: app-specific Apple ID password.
- `APPLE_TEAM_ID`: Apple Developer team identifier.

If all Windows credentials are configured, the Windows installers are Authenticode-signed. If all Apple credentials are configured, the macOS application is Developer ID-signed and notarized. Without credentials, the workflow publishes unsigned Windows installers and an ad-hoc signed macOS installer. A partially configured credential set is rejected to avoid silently producing an incorrectly signed release. Secrets are read only by the release workflow and are never available to pull-request jobs.

## Publish a release

1. Update every version together. `pnpm check:release-version` verifies the root, workspace packages, Tauri configuration, and Cargo package.
2. Update `CHANGELOG.md` and `.github/release-notes/desktop.md`.
3. Run `pnpm install --frozen-lockfile`, `pnpm audit --prod --audit-level moderate`, `pnpm lint`, `pnpm test`, and `pnpm typecheck`.
4. Merge the release commit into `master`, or run **Desktop release** manually.
5. Confirm the release contains `.msi` and `.exe` installers, a `.dmg`, and `SHA256SUMS.txt`.

The release tag is configured in the workflow. Signing and notarization are applied automatically when the complete platform credential set is available.
