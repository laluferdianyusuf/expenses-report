# FMS Mobile — Expo Dev Client

Aplikasi ini memakai **Expo Dev Client** (bukan Expo Go), karena membutuhkan native modules: SQLite, biometrik, dan secure store.

## Setup pertama

```bash
# Dari root monorepo
cp apps/mobile/.env.example apps/mobile/.env
npm install

# Build dev client (pilih salah satu)
cd apps/mobile
npm run build:dev:android   # APK development via EAS
npm run build:dev:ios       # Simulator build (macOS + EAS)

# Atau build lokal (butuh Android Studio / Xcode)
npm run prebuild
npm run android             # atau npm run ios
```

## Development sehari-hari

1. Jalankan API: `npm run api:dev` (dari root)
2. Install dev client APK/IPA di perangkat/emulator
3. Jalankan Metro: `npm run mobile:start`
4. Scan QR / buka app dev client — Metro akan terhubung otomatis

## Build production

```bash
cd apps/mobile
eas build --profile production --platform android
```

## Catatan

- Ganti `extra.eas.projectId` di `app.json` setelah `eas init`
- Untuk perangkat fisik, sesuaikan `EXPO_PUBLIC_API_URL` ke IP LAN komputer Anda
- Offline sync: transaksi disimpan SQLite saat offline, di-push otomatis saat online (lihat Pengaturan → Status Sinkronisasi)

## Push Notifications (FCM)

1. Buat project di [Firebase Console](https://console.firebase.google.com)
2. Download `google-services.json` → letakkan di `apps/mobile/google-services.json`
3. Tambahkan di `app.json` → `android.googleServicesFile`: `"./google-services.json"`
4. Konfigurasi FCM di backend (`apps/api/.env`):
   ```
   FCM_PROJECT_ID=...
   FCM_CLIENT_EMAIL=...
   FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
5. Set `extra.eas.projectId` di `app.json` (wajib untuk Expo push token)
6. Rebuild dev client setelah menambah FCM config

Token didaftarkan otomatis ke `POST /notifications/register-device` saat login.

## Upload Lampiran (R2)

Backend membutuhkan Cloudflare R2 di `apps/api/.env`:
```
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=fms-attachments
R2_PUBLIC_URL=https://...
```

Flow mobile: pilih file → presigned URL → upload ke R2 → confirm → link ke transaksi.

Lampiran offline masuk antrian upload dan diproses setelah sync selesai.
