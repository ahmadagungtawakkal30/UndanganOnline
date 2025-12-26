//ganti tema terang/gelap
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

//
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

const scriptURL =
  "https://script.google.com/macros/s/AKfycbwSejCm4FihFoJjsQsYPoPIPUBjmRvcxwlbCPVjarXmGC7Cp-I4jKmQs-uyIrdjHcgj/exec";

const urlParams = new URLSearchParams(window.location.search);
const tamu = decodeURIComponent(urlParams.get("to") || "Tamu Undangan").replace(
  /\+/g,
  " "
);
const guestDisplayEl = document.getElementById("guest-display");
if (guestDisplayEl) guestDisplayEl.innerText = tamu;
const formNamaEl = document.getElementById("form-nama");
if (formNamaEl) formNamaEl.value = tamu;

const musicBtn = document.getElementById("music-control");
const musicIcon = document.getElementById("music-icon");
const toggleBtn = document.getElementById("music-toggle");
const myAudio = document.getElementById("weddingMusic");
const playBtn = document.getElementById("music-toggle");

const musicList = [
  "music/BecauseYouLovedMe.mp3",
  "music/UntilIFoundYou.mp3",
  "music/OneinaMillion.mp3",
];

let currentTrack = 0;
let isPlaying = false;

// set lagu pertama
if (myAudio) {
  myAudio.src = musicList[currentTrack];
  myAudio.preload = "auto";
  // auto next saat lagu selesai
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
  // swiper failed to init (library not loaded) - ignore gracefully
}

function copyToClipboard(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  let text = el.innerText;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert("Berhasil disalin: " + text);
    });
  } else {
    // fallback
    const tmp = document.createElement("textarea");
    tmp.value = text;
    document.body.appendChild(tmp);
    tmp.select();
    try {
      document.execCommand("copy");
      alert("Berhasil disalin: " + text);
    } catch (e) {}
    document.body.removeChild(tmp);
  }
}

// function bukaUndangan() {
//   const coverEl = document.getElementById("cover");
//   const mainContentEl = document.getElementById("main-content");
//   if (coverEl) coverEl.classList.add("hide");
//   if (mainContentEl) mainContentEl.classList.add("show");
//   document.body.style.overflow = "auto";

//   if (myAudio) {
//     myAudio.play().catch(() => {});
//     if (musicBtn) musicBtn.style.display = "flex";
//     if (playBtn) playBtn.style.animation = "spin 4s linear infinite";
//   }

//   if (window.AOS) AOS.init({ duration: 1200, once: true });
//   if (typeof loadComments === "function") loadComments();
//   setTimeout(() => {
//     try {
//       if (swiper && typeof swiper.update === "function") swiper.update();
//     } catch (e) {}
//   }, 500);
// }

async function bukaUndangan() {
  const nama = new URLSearchParams(window.location.search).get("to");

  if (!nama) {
    notify(
      "Link Tidak Valid",
      "Undangan ini tidak memiliki nama tamu.",
      "error"
    );
    return;
  }

  showLoading(true);

  try {
    const res = await fetch(
      scriptURL + "?action=checkGuest&name=" + encodeURIComponent(nama)
    );

    const data = await res.json();

    showLoading(false);

    if (!data.valid) {
      notify(
        "Undangan Tidak Terdaftar",
        "Maaf, nama Anda tidak ditemukan di daftar tamu.",
        "error"
      );
      return;
    }

    // ===== BUKA UNDANGAN =====
    document.getElementById("cover")?.classList.add("hide");
    document.getElementById("main-content")?.classList.add("show");
    document.body.style.overflow = "auto";

    if (myAudio) {
      myAudio.play().catch(() => {});
      musicBtn.style.display = "flex";
      playBtn.style.animation = "spin 4s linear infinite";
    }

    AOS.init({
      duration: 800,
      once: true,
      disable: window.innerWidth < 768,
    });

    loadComments?.();
  } catch (err) {
    showLoading(false);
    notify(
      "Terjadi Kesalahan",
      "Gagal memverifikasi undangan. Silakan coba lagi."
    );
    console.error(err);
  }
}

function setReply(id, name) {
  const replyIdEl = document.getElementById("form-replyID");
  const replyIndicator = document.getElementById("reply-indicator");
  const replyToName = document.getElementById("reply-to-name");
  const pesanEl = document.getElementById("form-pesan");
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
  if (replyIdEl) replyIdEl.value = "";
  if (replyIndicator) replyIndicator.style.display = "none";
}

// function loadComments() {
//   const container = document.getElementById("comment-container");
//   if (!container) return;
//   fetch(scriptURL)
//     .then((res) => res.json())
//     .then((data) => {
//       container.innerHTML = "";
//       if (!data || data.length === 0) {
//         container.innerHTML =
//           '<p style="text-align:center; color:#999; font-size:0.8rem;">Belum ada ucapan.</p>';
//         return;
//       }
//       const mains = data.filter((i) => !i.replyID);
//       const replies = data.filter((i) => i.replyID);
//       mains.reverse().forEach((m) => {
//         const user = m.nama.replace(/\s+/g, "_").toLowerCase();
//         let html = `<div class="ig-comment"><div class="ig-avatar">${m.nama.charAt(
//           0
//         )}</div><div class="ig-bubble"><span class="ig-username">${user}</span><span class="ig-text">${
//           m.pesan
//         }</span><div class="ig-meta"><span onclick="setReply('${
//           m.id
//         }', '${user}')" style="cursor:pointer; color:var(--primary);">Balas</span></div></div></div>`;
//         const sub = replies.filter((r) => String(r.replyID) === String(m.id));
//         if (sub.length > 0) {
//           html += '<div class="reply-container">';
//           sub.forEach((s) => {
//             html += `<div class="ig-comment"><div class="ig-avatar" style="width:25px; height:25px; font-size:0.6rem;">${s.nama.charAt(
//               0
//             )}</div><div class="ig-bubble"><span class="ig-username">${s.nama.toLowerCase()}</span><span class="ig-text">${
//               s.pesan
//             }</span></div></div>`;
//           });
//           html += "</div>";
//         }
//         container.innerHTML += html;
//       });
//     })
//     .catch((err) => {
//       // ignore fetch errors (e.g., CORS) but keep app working
//     });
// }

function formatDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loadComments() {
  const container = document.getElementById("comment-container");
  if (!container) return;

  fetch(scriptURL + "?action=getMessages")
    .then((res) => res.json())
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
        const user = m.nama.replace(/\s+/g, "_").toLowerCase();

        let html = `
          <div class="ig-comment">
            <div class="ig-avatar">${m.nama.charAt(0)}</div>
            <div class="ig-bubble">
              <span class="ig-username">${user}</span>
              <span class="ig-text">${m.pesan}</span>
              <span class="ig-time">${formatDate(m.waktu)}</span>              
              <div class="ig-meta">
                <span onclick="setReply('${
                  m.id
                }','${user}')" style="cursor:pointer;color:var(--primary);">
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
            html += `
              <div class="ig-comment">
                <div class="ig-avatar" style="width:25px;height:25px;font-size:.6rem">
                  ${s.nama.charAt(0)}
                </div>
                <div class="ig-bubble">
                  <span class="ig-username">${s.nama.toLowerCase()}</span>
                  <span class="ig-text">${s.pesan}</span>
                  <span class="ig-time">${formatDate(s.waktu)}</span>
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

function showLoading(show) {
  document.getElementById("loading-overlay")?.classList.toggle("hidden", !show);
}

function notify(title, message, type = "") {
  const modal = document.getElementById("notify-modal");
  const titleEl = document.getElementById("notify-title");
  const msgEl = document.getElementById("notify-message");

  titleEl.textContent = title;
  msgEl.textContent = message;

  modal.classList.remove("hidden");
  modal.classList.remove("notify-error");

  if (type === "error") {
    modal.classList.add("notify-error");
  }
}

function closeNotify() {
  document.getElementById("notify-modal").classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("rsvp-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = document.getElementById("submit-btn");
      if (btn) {
        btn.disabled = true;
        btn.innerText = "Mengirim...";
      }
      fetch(scriptURL, {
        method: "POST",
        body: new FormData(e.target),
        mode: "no-cors",
      }).then(() => {
        if (btn) {
          btn.disabled = false;
          btn.innerText = "Kirim Lagi";
        }
        e.target.reset();
        if (formNamaEl) formNamaEl.value = tamu;
        cancelReply();
        setTimeout(() => {
          if (typeof loadComments === "function") loadComments();
        }, 2000);
      });
    });
  }

  // sparkle engine
  const sparkleCanvas = document.getElementById("goldSparkle");
  if (sparkleCanvas && sparkleCanvas.getContext) {
    const sCtx = sparkleCanvas.getContext("2d");
    let sw,
      sh,
      sparks = [];
    function resizeSparkle() {
      sw = sparkleCanvas.width = window.innerWidth;
      sh = sparkleCanvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeSparkle);
    resizeSparkle();

    for (let i = 0; i < 60; i++) {
      sparks.push({
        x: Math.random() * sw,
        y: Math.random() * sh,
        r: Math.random() * 1.6 + 0.4,
        v: Math.random() * 0.35 + 0.15,
        a: Math.random() * Math.PI * 2,
      });
    }

    function drawSparkle() {
      sCtx.clearRect(0, 0, sw, sh);
      sparks.forEach((p) => {
        sCtx.beginPath();
        sCtx.fillStyle = "rgba(212,188,150,.85)";
        sCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        sCtx.fill();

        p.y -= p.v;
        p.x += Math.sin(p.a) * 0.2;
        p.a += 0.02;

        if (p.y < 0) {
          p.y = sh;
          p.x = Math.random() * sw;
        }
      });
      requestAnimationFrame(drawSparkle);
    }
    drawSparkle();
  }

  // smooth scroll
  window.scrollToSection = function (id) {
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: "smooth" });
  };

  // auto highlight nav
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
      navButtons[sectionMap[current]].classList.add("active");
    }
  });

  // countdown
  const targetDate = new Date("2025-12-31T08:00:00");
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

    if (daysEl) daysEl.textContent = days;
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, "0");
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, "0");
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // scroll progress
  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    const progEl = document.getElementById("scroll-progress");
    if (progEl) progEl.style.width = progress + "%";
  });
});

// ===== NAV WIDGET TOGGLE =====
const navWidget = document.getElementById("navWidget");
const navToggle = document.querySelector(".nav-toggle");

let navOpen = true;

// if (window.innerWidth < 600) {
//   const navWidgetEl = document.getElementById("navWidget");
//   if (navWidgetEl) navWidgetEl.classList.add("closed");
// }
function toggleNav() {
  const nav = document.getElementById("navWidget");
  nav.classList.toggle("closed");
  nav.classList.toggle("nav-open");
}
