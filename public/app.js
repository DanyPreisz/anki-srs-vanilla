const cardEl = document.querySelector("#card");
const grades = document.querySelector("#grades");
const left = document.querySelector("#left");
let deck = [];
let show = false;

cardEl.addEventListener("click", () => {
  if (!deck[0]) return;
  show = true;
  grades.hidden = false;
  paint();
});

grades.addEventListener("click", async (event) => {
  const btn = event.target.closest("[data-g]");
  if (!btn || !deck[0]) return;
  await fetch("/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: deck[0].id, grade: btn.dataset.g }),
  });
  load();
});

document.querySelector("#add").addEventListener("submit", async (event) => {
  event.preventDefault();
  await fetch("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      front: document.querySelector("#front").value,
      back: document.querySelector("#back").value,
    }),
  });
  event.target.reset();
  load();
});

async function load() {
  deck = await (await fetch("/api/due")).json();
  show = false;
  grades.hidden = true;
  left.textContent = `${deck.length} para hoy`;
  paint();
}

function paint() {
  const c = deck[0];
  if (!c) {
    cardEl.textContent = "Nada pendiente.";
    return;
  }
  cardEl.textContent = show ? c.back : c.front + " · clic";
}

load();
