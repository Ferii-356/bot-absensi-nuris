const admin = require("firebase-admin");
const { Telegraf } = require("telegraf");

// Inisialisasi Firebase Admin hanya sekali (Vercel bisa reuse antar request)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// /start - pesan sambutan
bot.start((ctx) => {
  ctx.reply(
    "Assalamu'alaikum! 👋\n\n" +
    "Bot ini dipakai untuk mengirim izin absensi ke pengurus PPPM Nuris.\n\n" +
    "Langkah pertama, daftarkan dirimu dulu dengan perintah:\n" +
    "/daftar NIM_KAMU\n\n" +
    "Contoh: /daftar 240299"
  );
});

// /daftar <NIM> - hubungkan chat_id Telegram dengan data santri
bot.command("daftar", async (ctx) => {
  const teks = ctx.message.text.split(" ");
  const nim = teks[1];

  if (!nim) {
    return ctx.reply("Format salah. Contoh: /daftar 240299");
  }

  const chatId = ctx.chat.id.toString();

  const query = await db
    .collection("santri")
    .where("nim", "==", nim)
    .limit(1)
    .get();

  if (query.empty) {
    return ctx.reply(
      `NIM "${nim}" tidak ditemukan di data santri. ` +
      `Periksa kembali NIM kamu, atau hubungi pengurus.`
    );
  }

  const santriDoc = query.docs[0];
  const santriData = santriDoc.data();

  await santriDoc.ref.update({ telegram_chat_id: chatId });

  return ctx.reply(
    `Berhasil terdaftar sebagai ${santriData.nama}.\n\n` +
    `Sekarang kamu bisa kirim izin dengan perintah:\n` +
    `/izin alasan_kamu\n\n` +
    `Contoh: /izin Sakit demam, tidak bisa mengikuti kegiatan malam ini`
  );
});

// /izin <alasan> - catat izin ke Firestore
bot.command("izin", async (ctx) => {
  const teksLengkap = ctx.message.text;
  const alasan = teksLengkap.replace("/izin", "").trim();

  if (!alasan) {
    return ctx.reply("Format salah. Contoh: /izin Sakit demam");
  }

  const chatId = ctx.chat.id.toString();

  const query = await db
    .collection("santri")
    .where("telegram_chat_id", "==", chatId)
    .limit(1)
    .get();

  if (query.empty) {
    return ctx.reply(
      "Kamu belum terdaftar. Daftar dulu dengan perintah:\n" +
      "/daftar NIM_KAMU"
    );
  }

  const santriDoc = query.docs[0];
  const santriData = santriDoc.data();

  await db.collection("izin").add({
    santri_id: santriDoc.id,
    nama: santriData.nama,
    kelas_id: santriData.kelas_id,
    alasan: alasan,
    sumber: "telegram",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return ctx.reply(
    `Izin kamu sudah dicatat, ${santriData.nama}.\n` +
    `Alasan: "${alasan}"\n\n` +
    `Semoga lekas membaik / urusan lancar. 🙏`
  );
});

// Perintah tidak dikenali
bot.on("text", (ctx) => {
  ctx.reply(
    "Perintah tidak dikenali. Gunakan:\n" +
    "/daftar NIM - untuk mendaftar\n" +
    "/izin alasan - untuk mengirim izin"
  );
});

// Handler untuk Vercel Serverless Function (menerima webhook dari Telegram)
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(200).send("Bot izin absensi santri aktif.");
  }

  try {
    await bot.handleUpdate(req.body, res);
  } catch (error) {
    console.error("Error handling update:", error);
    res.status(500).send("Error");
  }
};
