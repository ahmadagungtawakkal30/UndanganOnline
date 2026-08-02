const SHEET_TAMU = "TAMU";
const SHEET_PESAN = "PESAN";
const SHEET_KEHADIRAN = "KEHADIRAN";

// ===== SENSOR KATA MAKIAN / KOTOR SAJA =====
const KATA_TERLARANG = [
  "anjing",
  "babi",
  "bangsat",
  "goblok",
  "tolol",
  "bego",
  "idiot",
  "dongo",
  "peler",
  "memek",
  "kontol",
  "ngentot",
  "bajingan",
  "brengsek",
  "lonte",
  "perek",
  "pelacur",
  "jablay",
  "pantek",
  "jancok",
  "ancuk",
  "ngewe",
];

/* =========================
   ROUTER (GET)
========================= */
function doGet(e) {
  const action = e.parameter.action || "";

  if (action === "checkGuest") return checkGuest(e);
  if (action === "getMessages") return getMessages();
  if (action === "getAttendance") return getAttendance();

  return json({ status: "ok" });
}

/* =========================
   ROUTER (POST)
========================= */
function doPost(e) {
  const action = e.parameter.action || "";

  if (action === "saveMessage") return saveMessage(e);
  if (action === "saveAttendance") return saveAttendance(e);

  return ContentService.createTextOutput("Error: Action Not Found").setMimeType(
    ContentService.MimeType.TEXT,
  );
}

/* =========================
   CEK VALIDASI TOKEN & AMBIL NAMA
========================= */
function checkGuest(e) {
  // Terima baik token (id) maupun nama (name) sebagai opsi verifikasi.
  const tokenInput = (e.parameter.id || "").toString().toUpperCase().trim();
  const nameInput = (e.parameter.name || "").toString().trim();

  if (!tokenInput && !nameInput) return json({ valid: false, name: "" });

  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_TAMU);
  if (!sheet || sheet.getLastRow() < 1) return json({ valid: false, name: "" });

  const data = sheet.getRange(1, 1, sheet.getLastRow(), 2).getValues();

  let valid = false;
  let namaTamu = "";

  for (let i = 0; i < data.length; i++) {
    const token = data[i][0].toString().toUpperCase().trim();
    const nama = data[i][1].toString().trim();

    if (tokenInput && token === tokenInput) {
      valid = true;
      namaTamu = nama;
      break;
    }

    if (
      !tokenInput &&
      nameInput &&
      nama.toLowerCase() === nameInput.toLowerCase()
    ) {
      // fallback: jika hanya dikirim nama, cocokkan nama (case-insensitive)
      valid = true;
      namaTamu = nama;
      break;
    }
  }

  return json({ valid: valid, name: namaTamu });
}

/* =========================
   1. SIMPAN PESAN (TOMBOL UCAPAN)
========================= */
function saveMessage(e) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_PESAN);

  const uniqueID = Date.now().toString();
  const nama = e.parameter.nama || "";
  const pesan = e.parameter.pesan || "";
  const replyID = e.parameter.replyID || "";
  const waktu = new Date();

  // Jalankan filter sensor kata
  if (apakahMengandungKataKasar(pesan)) {
    return ContentService.createTextOutput("Blocked").setMimeType(
      ContentService.MimeType.TEXT,
    );
  }

  sheet.appendRow([uniqueID, nama, pesan, waktu, replyID]);

  return ContentService.createTextOutput("Message Success").setMimeType(
    ContentService.MimeType.TEXT,
  );
}

/* =========================
   2. SIMPAN / UPDATE KEHADIRAN (TOMBOL RSVP)
========================= */
function saveAttendance(e) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_KEHADIRAN);
  const namaInput = (e.parameter.nama || "").trim();
  const kehadiranInput = e.parameter.kehadiran || "";

  if (!namaInput) {
    return ContentService.createTextOutput("Error: Name is empty").setMimeType(
      ContentService.MimeType.TEXT,
    );
  }

  const lastRow = sheet.getLastRow();
  let barisDitemukan = -1;

  if (lastRow >= 2) {
    const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < data.length; i++) {
      if (
        data[i][0].toString().toLowerCase().trim() === namaInput.toLowerCase()
      ) {
        barisDitemukan = i + 2;
        break;
      }
    }
  }

  if (barisDitemukan !== -1) {
    // Jika nama sudah ada, timpa status kehadiran yang lama
    sheet.getRange(barisDitemukan, 2).setValue(kehadiranInput);
    return ContentService.createTextOutput("Attendance Updated").setMimeType(
      ContentService.MimeType.TEXT,
    );
  } else {
    // Jika nama baru, buat baris baru di bawah
    sheet.appendRow([namaInput, kehadiranInput]);
    return ContentService.createTextOutput("Attendance Success").setMimeType(
      ContentService.MimeType.TEXT,
    );
  }
}

/* =========================
   AMBIL DATA PESAN
========================= */
function getAttendanceMap() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_KEHADIRAN);
  if (!sheet || sheet.getLastRow() < 2) return {};

  const data = sheet.getDataRange().getValues();
  const attendanceMap = {};

  for (let i = 1; i < data.length; i++) {
    const nama = (data[i][0] || "").toString().trim();
    const kehadiran = (data[i][1] || "").toString().trim();
    if (nama) {
      attendanceMap[nama.toLowerCase()] = kehadiran;
    }
  }

  return attendanceMap;
}

function getMessages() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_PESAN);
  if (!sheet || sheet.getLastRow() < 2) return json([]);

  const data = sheet.getDataRange().getValues();
  const attendanceMap = getAttendanceMap();
  const result = [];

  for (let i = 1; i < data.length; i++) {
    const nama = (data[i][1] || "").toString().trim();

    result.push({
      id: data[i][0],
      nama: nama,
      pesan: data[i][2],
      waktu: data[i][3],
      replyID: data[i][4],
      kehadiran: attendanceMap[nama.toLowerCase()] || "",
    });
  }

  return json(result);
}

/* =========================
   AMBIL DATA KEHADIRAN
========================= */
function getAttendance() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_KEHADIRAN);
  if (!sheet || sheet.getLastRow() < 2) return json([]);

  const data = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < data.length; i++) {
    result.push({
      nama: data[i][0],
      kehadiran: data[i][1],
    });
  }

  return json(result);
}

/* =========================
   HELPER DETEKSI KATA KASAR
========================= */
function apakahMengandungKataKasar(teks) {
  if (!teks) return false;
  const teksLower = teks.toLowerCase();
  return KATA_TERLARANG.some((kata) => {
    const regex = new RegExp("\\b" + kata + "\\b", "i");
    return regex.test(teksLower);
  });
}

/* =========================
   HELPER JSON
========================= */
function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
