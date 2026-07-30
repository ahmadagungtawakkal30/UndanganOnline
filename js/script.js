// ===== TEMA TERANG / GELAP =====
function toggleTheme() {
  document.body.classList.toggle("dark-night");
  const isDark = document.body.classList.contains("dark-night");
  const themeToggleEl = document.getElementById("theme-toggle");
  if (themeToggleEl) themeToggleEl.innerText = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
  document.body.classList.remove("dark-night");
  const themeToggleEl2 = document.getElementById("theme-toggle");
  if (themeToggleEl2) themeToggleEl2.innerText = "🌙";
}

// ===== HAPTIC FEEDBACK =====
function haptic() {
  if (navigator.vibrate) navigator.vibrate(15);
}
try {
  document
    .querySelectorAll("button")
    .forEach((btn) => btn.addEventListener("click", haptic));
} catch (e) {
  // ignore
}

// ===== ESCAPE HTML (Mencegah XSS) =====
function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ===== CONFIG & PARAMETERS =====
const scriptURL =
  "https://script.google.com/macros/s/AKfycbxLSxWqitV6Mve4CjSmiTenjtK6dnfO0SE_9JArtF7qChd_rK9X2Qqnlic9tyEdie3_/exec";

const urlParams = new URLSearchParams(window.location.search);
const tokenParam = urlParams.get("id");
const toParam = urlParams.get("to");
const guestDisplayEl = document.getElementById("guest-display");
const formNamaEl = document.getElementById("form-nama");

if (guestDisplayEl) {
  guestDisplayEl.innerText = tokenParam
    ? "Memuat Nama..."
    : toParam
      ? decodeURIComponent(toParam).replace(/\+/g, " ")
      : "Memuat Nama...";
}

// ===== FETCH GUEST PREVIEW =====
async function fetchGuestPreview() {
  try {
    const token = urlParams.get("id");
    if (!token) return;
    showLoading(true);
    const res = await fetch(
      scriptURL + "?action=checkGuest&id=" + encodeURIComponent(token),
    );
    const data = await res.json();
    showLoading(false);

    if (data && data.valid) {
      if (guestDisplayEl) guestDisplayEl.innerText = data.name;
      if (formNamaEl) formNamaEl.value = data.name;
      if (typeof loadAttendance === "function") loadAttendance();
    }
  } catch (e) {
    showLoading(false);
    console.error("Guest preview failed:", e);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    fetchGuestPreview();
    attachRsvpFormHandler();
  });
} else {
  fetchGuestPreview();
  attachRsvpFormHandler();
}

// ===== UTILS: FETCH WITH TIMEOUT =====
async function fetchWithTimeout(url, options = {}, timeoutMs = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ===== BALAS PESAN & RESET BALASAN =====
function setReply(id, name) {
  const replyIdEl = document.getElementById("form-replyID");
  const replyIndicator = document.getElementById("reply-indicator");
  const replyToName = document.getElementById("reply-to-name");
  const pesanEl =
    document.getElementById("form-pesan") ||
    document.querySelector("[name='pesan']");

  if (replyIdEl) replyIdEl.value = id;
  if (replyIndicator) replyIndicator.style.display = "block";
  if (replyToName) replyToName.innerText = "@" + name;
  if (pesanEl) {
    pesanEl.value = "@" + name + " ";
    pesanEl.focus();
  }
}

function cancelReply() {
  const replyIdEl = document.getElementById("form-replyID");
  const replyIndicator = document.getElementById("reply-indicator");
  const replyToName = document.getElementById("reply-to-name");

  if (replyIdEl) replyIdEl.value = "";
  if (replyToName) replyToName.innerText = "";
  if (replyIndicator) replyIndicator.style.display = "none";
}

// ===== RSVP FORM HANDLER =====
let submitResetTimer = null;

function clearSubmitResetTimer() {
  if (submitResetTimer) {
    clearTimeout(submitResetTimer);
    submitResetTimer = null;
  }
}

function setSubmitButtonState(isSubmitting, isSuccess = false) {
  const submitBtn = document.getElementById("submit-btn");
  if (!submitBtn) return;

  submitBtn.disabled = isSubmitting || isSuccess;

  if (isSubmitting) {
    submitBtn.textContent = "Mengirim...";
    submitBtn.style.opacity = "0.85";
  } else if (isSuccess) {
    submitBtn.textContent = "Terkirim ✓";
    submitBtn.style.opacity = "1";
  } else {
    submitBtn.textContent = "Kirim Pesan";
    submitBtn.style.opacity = "1";
  }
}

function attachRsvpFormHandler() {
  const rsvpForm = document.getElementById("rsvp-form");
  if (!rsvpForm) return;

  rsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(rsvpForm);
    const nama = formData.get("nama")?.toString().trim() || "";
    const pesan = formData.get("pesan")?.toString().trim() || "";
    const replyID = formData.get("replyID")?.toString().trim() || "";

    if (!nama || !pesan) {
      notify("Isi Data", "Nama dan pesan doa harus diisi.", "error");
      return;
    }

    clearSubmitResetTimer();
    setSubmitButtonState(true);

    const params = new URLSearchParams();
    params.append("action", "saveMessage");
    params.append("nama", nama);
    params.append("pesan", pesan);
    params.append("replyID", replyID);

    let showSuccessState = false;

    try {
      const res = await fetchWithTimeout(
        scriptURL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          body: params.toString(),
          cache: "no-store",
        },
        7000,
      );

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const text = await Promise.race([
        res.text().catch(() => ""),
        new Promise((resolve) => setTimeout(() => resolve(""), 600)),
      ]);

      if (text.toLowerCase().includes("blocked")) {
        throw new Error("Pesan diblokir oleh filter kata kasar.");
      }

      if (typeof loadComments === "function") {
        setTimeout(() => {
          loadComments(5000).catch((refreshErr) => {
            console.warn("Refresh comments failed:", refreshErr);
          });
        }, 200);
      }

      notify("Terkirim", "Pesan doa telah dikirim.");
      showSuccessState = true;
      setSubmitButtonState(false, true);
      clearSubmitResetTimer();

      submitResetTimer = window.setTimeout(() => {
        setSubmitButtonState(false, false);
      }, 1600);

      // --- RESET FORM & UI BALASAN ---
      rsvpForm.reset();
      if (formNamaEl) formNamaEl.value = nama; // Tetap pertahankan nama pengirim

      cancelReply(); // Sembunyikan indikator reply & reset input replyID

      const pesanInput =
        document.getElementById("form-pesan") ||
        document.querySelector("[name='pesan']");
      if (pesanInput) {
        pesanInput.value = ""; // Pastikan area teks bersih kembali
      }
    } catch (err) {
      console.error("Submit pesan error:", err);
      notify(
        "Gagal Mengirim",
        err.message || "Pesan gagal terkirim. Silakan coba lagi.",
        "error",
      );
    } finally {
      if (!showSuccessState) {
        setSubmitButtonState(false, false);
      }
    }
  });
}

// ===== PLAYER MUSIK =====
const musicBtn = document.getElementById("music-control");
const musicIcon = document.getElementById("music-icon");
const myAudio = document.getElementById("weddingMusic");
const playBtn = document.getElementById("music-toggle");

const musicList = [
  "music/BecauseYouLovedMe.mp3",
  "music/UntilIFoundYou.mp3",
  "music/OneinaMillion.mp3",
];

let currentTrack = 0;

if (myAudio) {
  myAudio.src = musicList[currentTrack];
  myAudio.preload = "auto";
  myAudio.addEventListener("ended", nextMusic);
}

function toggleMusic() {
  if (!myAudio) return;
  if (myAudio.paused) {
    myAudio.play();
    if (musicIcon) musicIcon.innerText = "🎵";
    if (playBtn) playBtn.style.animation = "spin 4s linear infinite";
  } else {
    myAudio.pause();
    if (musicIcon) musicIcon.innerText = "🔇";
    if (playBtn) playBtn.style.animation = "none";
  }
}

function nextMusic() {
  if (!myAudio) return;
  currentTrack = (currentTrack + 1) % musicList.length;
  myAudio.src = musicList[currentTrack];
  myAudio.play();
  if (musicIcon) musicIcon.innerText = "🎵";
  if (playBtn) playBtn.style.animation = "spin 4s linear infinite";
}

// ===== SWIPER SLIDER =====
try {
  var swiper = new Swiper(".mySwiper", {
    effect: "slide",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    loop: false,
    speed: 1000,
    coverflowEffect: {
      rotate: 30,
      stretch: 0,
      depth: 150,
      modifier: 1,
      slideShadows: true,
    },
    pagination: { el: ".swiper-pagination", clickable: true },
    autoplay: false,
  });
} catch (e) {
  // Swiper failed to init
}

// ===== UTILS: CLIPBOARD =====
function copyToClipboard(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  let text = el.innerText;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      notify("Berhasil", "Nomor rekening berhasil disalin!");
    });
  } else {
    const tmp = document.createElement("textarea");
    tmp.value = text;
    document.body.appendChild(tmp);
    tmp.select();
    try {
      document.execCommand("copy");
      notify("Berhasil", "Nomor rekening berhasil disalin!");
    } catch (e) {}
    document.body.removeChild(tmp);
  }
}

// ===== BUKA UNDANGAN =====
async function bukaUndangan() {
  const token = new URLSearchParams(window.location.search).get("id");
  const nameParam = new URLSearchParams(window.location.search).get("to");

  if (!token && !nameParam) {
    notify(
      "Link Tidak Valid",
      "Undangan ini tidak memiliki kode verifikasi akses.",
      "error",
    );
    return;
  }

  showLoading(true);

  try {
    const query = token
      ? `?action=checkGuest&id=${encodeURIComponent(token)}`
      : `?action=checkGuest&name=${encodeURIComponent(nameParam)}`;

    const res = await fetch(scriptURL + query);
    const data = await res.json();

    showLoading(false);

    if (!data.valid) {
      notify(
        "Undangan Tidak Terdaftar",
        "Maaf, data undangan Anda tidak valid.",
        "error",
      );
      return;
    }

    openInviteUI(data.name);
  } catch (err) {
    showLoading(false);
    notify(
      "Terjadi Kesalahan",
      "Gagal memverifikasi akun undangan. Silakan coba lagi.",
      "error",
    );
    console.error(err);
  }
}

function openInviteUI(namaAsliTamu) {
  if (guestDisplayEl) guestDisplayEl.innerText = namaAsliTamu;
  if (formNamaEl) formNamaEl.value = namaAsliTamu;

  document.getElementById("cover")?.classList.add("hide");
  document.getElementById("main-content")?.classList.add("show");
  document.body.style.overflow = "auto";

  if (myAudio) {
    myAudio.play().catch(() => {});
    if (musicBtn) musicBtn.style.display = "flex";
    if (playBtn) playBtn.style.animation = "spin 4s linear infinite";
  }

  if (window.AOS) {
    AOS.init({ duration: 800, once: true, disable: window.innerWidth < 768 });
  }

  if (typeof loadComments === "function") loadComments();
  if (typeof loadAttendance === "function") loadAttendance();
}

// ===== KEHADIRAN (RSVP) =====
function setAttendanceStatus(status) {
  const statusEl = document.getElementById("attendance-status");
  const yesBtn = document.querySelector(".btn-attendance--yes");
  const tentativeBtn = document.querySelector(".btn-attendance--tentative");
  const noBtn = document.querySelector(".btn-attendance--no");
  const storedStatus = (status || "").toString().trim();
  const normalizedStatus = storedStatus.toLowerCase();
  const isHadir = normalizedStatus === "hadir";
  const isTentatif = normalizedStatus === "tentatif";
  const isTidakHadir =
    normalizedStatus === "tidak hadir" || normalizedStatus === "berhalangan";

  if (statusEl) {
    statusEl.textContent = storedStatus
      ? isHadir
        ? "✅ Hadir"
        : isTentatif
          ? "⏳ Tentatif"
          : isTidakHadir
            ? "❌ Berhalangan"
            : storedStatus
      : "Belum dipilih";
  }
  if (yesBtn) yesBtn.classList.toggle("active", isHadir);
  if (tentativeBtn) tentativeBtn.classList.toggle("active", isTentatif);
  if (noBtn) noBtn.classList.toggle("active", isTidakHadir);
}

function loadAttendance() {
  const rawName = (
    formNamaEl?.value ||
    guestDisplayEl?.innerText ||
    urlParams.get("to") ||
    ""
  )
    .toString()
    .trim();
  const normalizedName = rawName.toLowerCase().replace(/\s+/g, " ").trim();
  if (!normalizedName) return;

  fetch(scriptURL + "?action=getAttendance")
    .then((res) => res.json())
    .then((data) => {
      if (!Array.isArray(data)) return;
      const current = data
        .filter((item) => {
          const itemName = (item.nama || "")
            .toString()
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
          return itemName === normalizedName;
        })
        .pop();

      if (current && current.kehadiran) {
        setAttendanceStatus(current.kehadiran.toString().trim());
      }
    })
    .catch(() => {});
}

function confirmAttendance(status) {
  setAttendanceStatus(status);
  saveAttendanceStatus(status);
  toggleAttendanceSheet(false);
}

function getAttendanceBadge(attendance) {
  const text = (attendance || "").toString().trim();
  const normalized = text.toLowerCase();
  if (normalized === "hadir") {
    return { icon: "✅", className: "ig-attendance--yes" };
  }
  if (normalized === "tentatif") {
    return { icon: "⏳", className: "ig-attendance--tentative" };
  }
  if (normalized === "tidak hadir" || normalized === "berhalangan") {
    return { icon: "❌", className: "ig-attendance--no" };
  }
  return { icon: "", className: "" };
}

function saveAttendanceStatus(status) {
  const nama =
    formNamaEl?.value ||
    new URLSearchParams(window.location.search).get("to") ||
    "";
  if (!nama) return;

  const params = new URLSearchParams();
  params.append("action", "saveAttendance");
  params.append("nama", nama);
  params.append("kehadiran", status);

  fetch(scriptURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: params.toString(),
  }).catch(() => {});
}

function toggleAttendanceSheet(show) {
  const sheet = document.getElementById("attendance-sheet");
  if (!sheet) return;
  sheet.classList.toggle("hidden", !show);
}

// ===== MEMUAT PESAN / UCAPAN =====
function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loadComments(timeoutMs = 8000) {
  const container = document.getElementById("comment-container");
  if (!container) return Promise.resolve();

  container.innerHTML =
    '<p style="text-align:center; color:#999; font-size:.8rem;">Memuat pesan...</p>';

  return fetchWithTimeout(
    `${scriptURL}?action=getMessages&_=${Date.now()}`,
    { cache: "no-store" },
    timeoutMs,
  )
    .then((res) => {
      if (!res.ok) throw new Error(`getMessages returned ${res.status}`);
      return res.json();
    })
    .then((data) => {
      container.innerHTML = "";

      if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML =
          '<p style="text-align:center; color:#999; font-size:.8rem;">Belum ada ucapan.</p>';
        return;
      }

      const mains = data.filter((i) => !i.replyID);
      const replies = data.filter((i) => i.replyID);

      mains.reverse().forEach((m) => {
        const rawUser = (m.nama || "Tamu").replace(/\s+/g, "_").toLowerCase();
        const safeUser = escapeHTML(rawUser);
        const safePesan = escapeHTML(m.pesan);
        const safeNama = escapeHTML(m.nama || "Tamu");
        const safeWaktu = escapeHTML(formatDate(m.waktu));
        const safeId = escapeHTML(m.id);

        const attendance = (m.kehadiran || "").toString().trim();
        const badge = getAttendanceBadge(attendance);
        const attendanceLabel = badge.icon
          ? `<span class="ig-attendance ${badge.className}" title="${escapeHTML(attendance)}">${badge.icon}</span>`
          : "";

        let html = `
          <div class="ig-comment">
            <div class="ig-avatar">${safeNama.charAt(0)}</div>
            <div class="ig-bubble">
              <div class="ig-comment-header">
                <span class="ig-username">${safeUser}</span>
                ${attendanceLabel}
              </div>
              <span class="ig-text">${safePesan}</span>
              <span class="ig-time">${safeWaktu}</span>
              <div class="ig-meta">
                <span onclick="setReply('${safeId}','${safeUser}')" style="cursor:pointer;color:var(--primary);">
                  Balas
                </span>
              </div>
            </div>
          </div>
        `;

        const sub = replies.filter((r) => String(r.replyID) === String(m.id));
        if (sub.length) {
          html += `<div class="reply-container">`;
          sub.forEach((s) => {
            const replyAttendance = (s.kehadiran || "").toString().trim();
            const replyBadge = getAttendanceBadge(replyAttendance);
            const replyAttendanceLabel = replyBadge.icon
              ? `<span class="ig-attendance ${replyBadge.className}" title="${escapeHTML(replyAttendance)}">${replyBadge.icon}</span>`
              : "";

            html += `
              <div class="ig-comment">
                <div class="ig-avatar" style="width:25px;height:25px;font-size:.6rem">
                  ${escapeHTML(s.nama || "Tamu").charAt(0)}
                </div>
                <div class="ig-bubble">
                  <div class="ig-comment-header">
                    <span class="ig-username">${escapeHTML((s.nama || "").toLowerCase())}</span>
                    ${replyAttendanceLabel}
                  </div>
                  <span class="ig-text">${escapeHTML(s.pesan)}</span>
                  <span class="ig-time">${escapeHTML(formatDate(s.waktu))}</span>
                </div>
              </div>
            `;
          });
          html += `</div>`;
        }

        container.innerHTML += html;
      });
    })
    .catch((err) => {
      console.error("Load comments error:", err);
    });
}

// ===== UI HELPER: NOTIFY & LOADING =====
function notify(title, message, type = "info") {
  const modal = document.getElementById("notify-modal");
  const titleEl = document.getElementById("notify-title");
  const msgEl = document.getElementById("notify-message");

  if (titleEl) titleEl.innerText = title;
  if (msgEl) msgEl.innerText = message;
  if (modal) modal.classList.remove("hidden");
}

function closeNotify() {
  const modal = document.getElementById("notify-modal");
  if (modal) modal.classList.add("hidden");
}

function showLoading(show) {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.style.display = show ? "flex" : "none";

  const openBtn = document.querySelector(".btn-open");
  if (openBtn) {
    openBtn.disabled = !!show;
    openBtn.innerText = show ? "Memeriksa..." : "Buka Undangan";
  }
}

// ===== NAVIGATION & SCROLL =====
window.scrollToSection = function (id) {
  const target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: "smooth" });
};

const navButtons = document.querySelectorAll(".nav-widget button");
const sectionMap = {
  hero: 0,
  "pengantar-ayat": 1,
  gallery: 2,
  location: 3,
  family: 4,
  "wedding-gift": 5,
  "rsvp-section": 6,
};
const sections = Object.keys(sectionMap)
  .map((id) => document.getElementById(id))
  .filter(Boolean);

window.addEventListener("scroll", () => {
  let current = null;
  sections.forEach((sec) => {
    const rect = sec.getBoundingClientRect();
    if (
      rect.top <= window.innerHeight / 2 &&
      rect.bottom >= window.innerHeight / 2
    ) {
      current = sec.id;
    }
  });

  navButtons.forEach((btn) => btn.classList.remove("active"));
  if (current && sectionMap[current] !== undefined) {
    if (navButtons[sectionMap[current]]) {
      navButtons[sectionMap[current]].classList.add("active");
    }
  }
});

// ===== COUNTDOWN =====
const targetDate = new Date("2025-12-25T08:00:00");
const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const eventDateEl = document.getElementById("event-date");
const eventDayEl = document.getElementById("event-day");

const dayNames = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

if (eventDayEl && eventDateEl) {
  eventDayEl.textContent = dayNames[targetDate.getDay()];
  eventDateEl.textContent = `${targetDate.getDate()} ${
    monthNames[targetDate.getMonth()]
  } ${targetDate.getFullYear()}`;
}

function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    if (daysEl) daysEl.textContent = "00";
    if (hoursEl) hoursEl.textContent = "00";
    if (minutesEl) minutesEl.textContent = "00";
    if (secondsEl) secondsEl.textContent = "00";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
  if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
  if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, "0");
  if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ===== SCROLL PROGRESS BAR =====
window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  const progEl = document.getElementById("scroll-progress");
  if (progEl) progEl.style.width = progress + "%";
});

// ===== TOGGLE NAV & LOGOUT =====
function toggleNav() {
  const nav = document.getElementById("navWidget");
  if (!nav) return;
  nav.classList.toggle("closed");
}

function logout() {
  try {
    if (myAudio) {
      myAudio.pause();
      myAudio.currentTime = 0;
    }
  } catch (e) {}

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {}

  const u = new URL(window.location.href);
  u.search = "";
  window.location.href = u.toString();
}

// Function bantu untuk menentukan badge berdasarkan 3 kondisi
function getIndikatorKehadiran(status) {
  const statusNormalized = (status || "").toLowerCase().trim();

  switch (statusNormalized) {
    case "hadir":
      return { label: "Hadir", icon: "✓", warnaClass: "status-hadir" };
    case "tentatif":
    case "ragu":
      return { label: "Tentatif", icon: "?", warnaClass: "status-tentatif" };
    case "berhalangan":
    case "tidak hadir":
      return {
        label: "Berhalangan",
        icon: "✕",
        warnaClass: "status-berhalangan",
      };
    default:
      return { label: "-", icon: "", warnaClass: "" };
  }
}

// Function render data ke HTML
function renderPesanDoa(dataDoa) {
  const container = document.getElementById("container-doa");
  if (!container) return;

  container.innerHTML = "";

  dataDoa.forEach((item) => {
    const indikator = getIndikatorKehadiran(item.status);

    const card = document.createElement("div");
    card.className = "card-doa";

    card.innerHTML = `
      <div class="header-doa">
        <strong class="nama-pengirim">${item.nama || "Anonim"}</strong>
        <span class="badge-kehadiran ${indikator.warnaClass}">
          <span>${indikator.icon}</span>
          <span>${indikator.label}</span>
        </span>
      </div>
      <p class="isi-pesan">${item.pesan || ""}</p>
    `;

    container.appendChild(card);
  });
}

// Contoh pemanggilan data
const dummyData = [
  { nama: "Budi Santoso", status: "hadir", pesan: "Selamat ya!" },
  { nama: "Siti Rahma", status: "tentatif", pesan: "Insya Allah hadir." },
  { nama: "Ahmad", status: "berhalangan", pesan: "Maaf belum bisa hadir." },
];

renderPesanDoa(dummyData);
