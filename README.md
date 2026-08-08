# Bot Telegram - Fitur Izin Absensi Santri (versi Vercel)

## Yang dilakukan bot ini
- `/start` — pesan sambutan + petunjuk
- `/daftar NIM` — santri daftarkan chat Telegram-nya, dicocokkan ke data di collection `santri`
- `/izin alasan` — santri kirim izin, otomatis tersimpan ke collection `izin`

## Langkah deploy

### 1. Buat bot Telegram & dapatkan token
1. Chat **@BotFather** di Telegram
2. Kirim `/newbot`, ikuti instruksinya
3. Simpan **token** yang diberikan (bentuknya seperti `123456789:ABCdefGhIJKl...`)

### 2. Download Service Account Key dari Firebase (GRATIS, tidak perlu Blaze)
1. Firebase Console → project `absensi-santri-nuris` → ikon gerigi ⚙️ (Settings) → **Project settings**
2. Tab **Service accounts**
3. Klik **Generate new private key** → **Generate key**
4. File `.json` akan otomatis terdownload — **JANGAN dibagikan ke siapa pun**, ini kunci penuh ke Firestore kamu

### 3. Ubah file JSON itu jadi teks Base64
File JSON itu perlu diubah ke format teks tunggal supaya bisa dipakai sebagai environment variable. Caranya:

**Kalau pakai Windows PowerShell:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\ke\file-service-account.json")) | Set-Clipboard
```
Perintah ini otomatis meng-copy hasilnya ke clipboard kamu.

### 4. Push kode ini ke GitHub repo `bot-absensi-nuris`
Di terminal, masuk ke folder project ini, jalankan:
```bash
git init
git add .
git commit -m "Bot izin absensi awal"
git branch -M main
git remote add origin https://github.com/Ferii-356/bot-absensi-nuris.git
git push -u origin main
```

### 5. Import project ini di Vercel
1. Buka [vercel.com/new](https://vercel.com/new)
2. Cari & pilih repo `bot-absensi-nuris` dari GitHub
3. Klik **Import**

### 6. Set Environment Variables di Vercel
Sebelum klik Deploy, buka bagian **Environment Variables**, tambahkan 2 variable:

| Name | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | token dari BotFather (langkah 1) |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | hasil base64 dari langkah 3 (paste hasil copy tadi) |

Klik **Deploy**.

### 7. Dapatkan URL project
Setelah deploy selesai, Vercel kasih URL seperti:
```
https://bot-absensi-nuris.vercel.app
```
Endpoint bot-nya ada di:
```
https://bot-absensi-nuris.vercel.app/api/telegramBot
```

### 8. Hubungkan URL tadi sebagai webhook Telegram
Ganti `<TOKEN>` dan `<URL>`, buka link ini di browser:
```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=<URL>/api/telegramBot
```
Kalau berhasil, muncul: `{"ok":true,"result":true,"description":"Webhook was set"}`

### 9. Testing
Buka Telegram, cari bot kamu, kirim `/start`. Coba `/daftar <NIM_yang_sudah_ada>`, lalu `/izin alasan test`.

Cek Firestore Console → collection `izin`, harusnya muncul dokumen baru.

## Catatan
- Setiap kali kode di GitHub berubah dan di-push, Vercel otomatis re-deploy
- Kalau ada error, cek log di Vercel Dashboard → project ini → tab **Logs**
