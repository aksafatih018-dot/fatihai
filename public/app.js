
const messagesEl = document.getElementById("messages");
const input = document.getElementById("messageInput");
const form = document.getElementById("chatForm");
const welcome = document.getElementById("welcome");
const newChatBtn = document.getElementById("newChat");
const historyEl = document.getElementById("history");

let chats = JSON.parse(localStorage.getItem("fatihai_chats") || "[]");
let currentChat = [];

function saveChats() {
  localStorage.setItem("fatihai_chats", JSON.stringify(chats));
}

function addMessage(role, content) {
  const div = document.createElement("div");
  div.className = "message " + role;
  div.textContent = content;
  messagesEl.appendChild(div);
}

function renderMessages() {
  messagesEl.innerHTML = "";
  welcome.style.display = currentChat.length ? "none" : "block";

  currentChat.forEach(message => {
    addMessage(message.role, message.content);
  });
}

function renderHistory() {
  historyEl.innerHTML = "";

  chats.forEach((chat, index) => {
    const button = document.createElement("button");
    button.className = "history-item";
    button.style.cssText =
      "display:block;width:100%;border:0;background:transparent;text-align:left;color:#ccc;cursor:pointer";

    button.textContent = chat[0]?.content?.slice(0, 25) || "Percakapan";
    button.onclick = () => {
      currentChat = [...chat];
      renderMessages();
    };

    historyEl.appendChild(button);
  });
}

function saveCurrentChat() {
  if (!currentChat.length) return;

  chats.unshift([...currentChat]);
  chats = chats.slice(0, 20);
  saveChats();
  renderHistory();
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  currentChat.push({ role: "user", content: text });
  addMessage("user", text);

  input.value = "";
  welcome.style.display = "none";

  const loading = document.createElement("div");
  loading.className = "message assistant";
  loading.textContent = "FatihAi sedang memeriksa koneksi...";
  messagesEl.appendChild(loading);

  try {
    const response = await fetch(
      new URL("api/chat", window.location.href),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentChat })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Server AI belum tersedia.");
    }

    loading.remove();

    const reply = data.reply || "Belum ada jawaban.";
    currentChat.push({ role: "assistant", content: reply });
    addMessage("assistant", reply);
  } catch (error) {
    loading.textContent =
      "AI belum terhubung. Tampilan chat sudah aktif, tetapi backend AI FatihAi belum dipasang.";
  }

  saveCurrentChat();
});

newChatBtn.addEventListener("click", () => {
  saveCurrentChat();
  currentChat = [];
  renderMessages();
});

renderHistory();
renderMessages();
