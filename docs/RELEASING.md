# Desktop release process

Jauto publishes signed Windows x64 and notarized universal macOS installers from `.github/workflows/desktop-release.yml`. A release is created only after dependency audit, lint, tests, type checks, web and desktop frontend builds, native builds, signature verification, and notarization validation succeed.

## Required repository secrets

- `WINDOWS_CERTIFICATE`: base64-encoded PFX Authenticode certificate.
- `WINDOWS_CERTIFICATE_PASSWORD`: PFX password.
- `APPLE_CERTIFICATE`: base64-encoded Developer ID Application PKCS#12 certificate.
- `APPLE_CERTIFICATE_PASSWORD`: PKCS#12 and temporary keychain password.
- `APPLE_SIGNING_IDENTITY`: full Developer ID Application identity.
- `APPLE_ID`: Apple developer account email.
- `APPLE_PASSWORD`: app-specific Apple ID password.
- `APPLE_TEAM_ID`: Apple Developer team identifier.

The workflow rejects publication when any credential is missing. Secrets are read only by the release workflow and are never available to pull-request jobs.

## Publish a release

1. Update every version together. `pnpm check:release-version` verifies the root, workspace packages, Tauri configuration, and Cargo package.
2. Update `CHANGELOG.md` and `.github/release-notes/desktop.md`.
3. Run `pnpm install --frozen-lockfile`, `pnpm audit --prod --audit-level moderate`, `pnpm lint`, `pnpm test`, and `pnpm typecheck`.
4. Push a matching tag such as `v0.2.0`, or run **Signed desktop release** manually with that tag.
5. Confirm the release contains signed `.msi` and `.exe` installers, a notarized `.dmg`, and `SHA256SUMS.txt`.

Tags containing a hyphen, such as `v0.3.0-beta.1`, are marked as prereleases. Stable and prerelease installers use the same signing requirements.
