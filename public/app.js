const $ = (id) => document.getElementById(id);
const input = $("promptInput");
const messagesEl = $("messages");
const welcome = $("welcome");
const sendBtn = $("sendBtn");
let history = [];

const modePrompts = {
  chat: "",
  study: "Bertindaklah sebagai tutor yang sabar. Jelaskan dengan bahasa sederhana, contoh, lalu cek pemahaman saya. Permintaan saya: ",
  coding: "Bertindaklah sebagai mentor pemrograman. Berikan kode yang aman, komentar, dan langkah menjalankannya. Permintaan saya: ",
  writer: "Bantu saya menulis dengan bahasa yang jelas dan rapi. Permintaan saya: ",
  translate: "Terjemahkan teks saya secara akurat. Jelaskan istilah sulit jika perlu. Teks: ",
  summary: "Ringkas materi berikut menjadi poin-poin utama yang mudah dipahami. Materi: "
};
let currentMode = "chat";

function addMessage(role, content, extraClass = "") {
  welcome.hidden = true;
  const row = document.createElement("div");
  row.className = `message ${role}`;
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "K" : "F";
  const bubble = document.createElement("div");
  bubble.className = `bubble ${extraClass}`;
  bubble.textContent = content;
  row.append(avatar, bubble);
  messagesEl.append(row);
  $("chatArea").scrollTop = $("chatArea").scrollHeight;
  return bubble;
}

function saveHistory() {
  try { localStorage.setItem("fatihai-history", JSON.stringify(history.slice(-30))); } catch {}
}
function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem("fatihai-history") || "[]");
    if (Array.isArray(saved)) {
      history = saved.filter(m => m && ["user","assistant"].includes(m.role) && typeof m.content === "string");
      history.forEach(m => addMessage(m.role, m.content));
    }
  } catch { history = []; }
}
async function sendMessage(text) {
  const clean = text.trim();
  if (!clean || sendBtn.disabled) return;
  const outgoing = (modePrompts[currentMode] || "") + clean;
  input.value = "";
  input.style.height = "auto";
  history.push({ role: "user", content: outgoing });
  addMessage("user", clean);
  const pending = addMessage("assistant", "FatihAi sedang berpikir...");
  sendBtn.disabled = true;
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-12) })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Permintaan gagal.");
    pending.textContent = data.reply;
    history.push({ role: "assistant", content: data.reply });
    saveHistory();
  } catch (err) {
    pending.textContent = err.message || "Terjadi kesalahan. Coba lagi.";
    pending.classList.add("error");
    history.pop();
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}
sendBtn.addEventListener("click", () => sendMessage(input.value));
input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input.value); }
});
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 140) + "px";
});
document.querySelectorAll(".suggestion").forEach(btn => btn.addEventListener("click", () => {
  input.value = btn.dataset.prompt || "";
  input.focus();
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 140) + "px";
}));
document.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => {
  currentMode = btn.dataset.mode;
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b === btn));
  $("sidebar").classList.remove("open");
  const names = {chat:"AI Chat",study:"AI Study",coding:"AI Coding",writer:"AI Writer",translate:"Translator",summary:"Summarizer"};
  input.placeholder = `Tulis permintaan untuk ${names[currentMode]}...`;
}));
$("newChat").addEventListener("click", () => {
  history = [];
  messagesEl.replaceChildren();
  welcome.hidden = false;
  localStorage.removeItem("fatihai-history");
  $("sidebar").classList.remove("open");
});
$("clearChat").addEventListener("click", () => $("newChat").click());
$("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));

fetch("/api/status").then(r => r.json()).then(data => {
  $("apiStatus").textContent = data.ready ? "AI API siap" : "API belum diatur";
  $("apiStatus").previousElementSibling.classList.toggle("ready", data.ready);
}).catch(() => { $("apiStatus").textContent = "Server belum tersambung"; });

loadHistory();
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));