//ganti tema terang/gelap
function toggleTheme() {
  document.body.classList.toggle("dark-night");

  const isDark = document.body.classList.contains("dark-night");
  document.getElementById("theme-toggle").innerText = isDark ? "☀️" : "🌙";

  localStorage.setItem("theme", isDark ? "dark" : "light");
}
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "light") {
  document.body.classList.remove("dark-night");
  document.getElementById("theme-toggle").innerText = "🌙";
}

//
function haptic() {
  if (navigator.vibrate) navigator.vibrate(15);
}
document
  .querySelectorAll("button")
  .forEach((btn) => btn.addEventListener("click", haptic));

const scriptURL =
  "https://script.google.com/macros/s/AKfycbwgYcxOMLnSSJU0Feg5uyoaQtZxLDXUevAwySwdc9PiQaKbuhjC6nZt_CySFkCtyMuc/exec";

const urlParams = new URLSearchParams(window.location.search);
const tamu = decodeURIComponent(urlParams.get("to") || "Tamu Undangan").replace(
  /\+/g,
  " "
);
document.getElementById("guest-display").innerText = tamu;
document.getElementById("form-nama").value = tamu;

const musicBtn = document.getElementById("music-control");
const musicIcon = document.getElementById("music-icon");
const toggleBtn = document.getElementById("music-toggle");
const myAudio = document.getElementById("weddingMusic");
const playBtn = document.getElementById("music-toggle");

const musicList = [
  "music/UntilIFoundYou.mp3",
  "music/BecauseYouLovedMe.mp3",
  "music/OneinaMillion.mp3",
];

let currentTrack = 0;
let isPlaying = false;

// set lagu pertama
myAudio.src = musicList[currentTrack];
myAudio.preload = "auto";

// auto next saat lagu selesai
myAudio.addEventListener("ended", nextMusic);

function toggleMusic() {
  if (myAudio.paused) {
    myAudio.play();
    musicIcon.innerText = "🎵";
    playBtn.style.animation = "spin 4s linear infinite";
  } else {
    myAudio.pause();
    musicIcon.innerText = "🔇";
    playBtn.style.animation = "none";
  }
}

function nextMusic() {
  currentTrack = (currentTrack + 1) % musicList.length;
  myAudio.src = musicList[currentTrack];
  myAudio.play();
  musicIcon.innerText = "🎵";
  playBtn.style.animation = "spin 4s linear infinite";
}

var swiper = new Swiper(".mySwiper", {
  effect: "coverflow",
  grabCursor: true,
  centeredSlides: true,
  slidesPerView: "auto",
  loop: true,
  speed: 1000,
  coverflowEffect: {
    rotate: 30,
    stretch: 0,
    depth: 150,
    modifier: 1,
    slideShadows: true,
  },
  pagination: { el: ".swiper-pagination", clickable: true },
  autoplay: { delay: 2500, disableOnInteraction: false },
});

function copyToClipboard(elementId) {
  let text = document.getElementById(elementId).innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert("Berhasil disalin: " + text);
  });
}

function bukaUndangan() {
  document.getElementById("cover").classList.add("hide");
  document.getElementById("main-content").classList.add("show");
  document.body.style.overflow = "auto";

  myAudio.play().catch(() => {});
  document.getElementById("music-control").style.display = "flex";

  playBtn.style.animation = "spin 4s linear infinite";

  AOS.init({ duration: 1200, once: true });
  loadComments();
  setTimeout(() => swiper.update(), 500);
}

function setReply(id, name) {
  document.getElementById("form-replyID").value = id;
  document.getElementById("reply-indicator").style.display = "block";
  document.getElementById("reply-to-name").innerText = "@" + name;
  document.getElementById("form-pesan").value = "@" + name + " ";
  document.getElementById("form-pesan").focus();
}

function cancelReply() {
  document.getElementById("form-replyID").value = "";
  document.getElementById("reply-indicator").style.display = "none";
}

function loadComments() {
  const container = document.getElementById("comment-container");
  fetch(scriptURL)
    .then((res) => res.json())
    .then((data) => {
      container.innerHTML = "";
      if (!data || data.length === 0) {
        container.innerHTML =
          '<p style="text-align:center; color:#999; font-size:0.8rem;">Belum ada ucapan.</p>';
        return;
      }
      const mains = data.filter((i) => !i.replyID);
      const replies = data.filter((i) => i.replyID);
      mains.reverse().forEach((m) => {
        const user = m.nama.replace(/\s+/g, "_").toLowerCase();
        let html = `<div class="ig-comment"><div class="ig-avatar">${m.nama.charAt(
          0
        )}</div><div class="ig-bubble"><span class="ig-username">${user}</span><span class="ig-text">${
          m.pesan
        }</span><div class="ig-meta"><span onclick="setReply('${
          m.id
        }', '${user}')" style="cursor:pointer; color:var(--primary);">Balas</span></div></div></div>`;
        const sub = replies.filter((r) => String(r.replyID) === String(m.id));
        if (sub.length > 0) {
          html += '<div class="reply-container">';
          sub.forEach((s) => {
            html += `<div class="ig-comment"><div class="ig-avatar" style="width:25px; height:25px; font-size:0.6rem;">${s.nama.charAt(
              0
            )}</div><div class="ig-bubble"><span class="ig-username">${s.nama.toLowerCase()}</span><span class="ig-text">${
              s.pesan
            }</span></div></div>`;
          });
          html += "</div>";
        }
        container.innerHTML += html;
      });
    });
}

document.getElementById("rsvp-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const btn = document.getElementById("submit-btn");
  btn.disabled = true;
  btn.innerText = "Mengirim...";
  fetch(scriptURL, {
    method: "POST",
    body: new FormData(e.target),
    mode: "no-cors",
  }).then(() => {
    btn.disabled = false;
    btn.innerText = "Kirim Lagi";
    e.target.reset();
    document.getElementById("form-nama").value = tamu;
    cancelReply();
    setTimeout(loadComments, 2000);
  });
});

/* ===== GOLD SPARKLE ENGINE (ADD-ON ONLY) ===== */
const sparkleCanvas = document.getElementById("goldSparkle");
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
/* ===== SMOOTH SCROLL WIDGET ===== */
function scrollToSection(id) {
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: "smooth" });
  }
}
/* ===== AUTO HIGHLIGHT NAV WIDGET ===== */
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

const sections = Object.keys(sectionMap).map((id) =>
  document.getElementById(id)
);

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

//hitungan mundur jadwal resepsi
const targetDate = new Date(2025, 11, 25, 8, 0, 0);

// ELEMENT
const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const eventDateEl = document.getElementById("event-date");
const eventDayEl = document.getElementById("event-day");

// FORMAT TANGGAL INDONESIA
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

// SET TANGGAL TEKS
eventDayEl.textContent = dayNames[targetDate.getDay()];
eventDateEl.textContent = `${targetDate.getDate()} ${
  monthNames[targetDate.getMonth()]
} ${targetDate.getFullYear()}`;

function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    daysEl.textContent = "00";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  daysEl.textContent = days;
  hoursEl.textContent = String(hours).padStart(2, "0");
  minutesEl.textContent = String(minutes).padStart(2, "0");
  secondsEl.textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);

//visual
window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = (scrollTop / docHeight) * 100;

  document.getElementById("scroll-progress").style.width = progress + "%";
});

