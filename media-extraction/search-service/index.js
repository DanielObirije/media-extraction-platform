let currentVideos = [];

async function search() {
  const q = document.getElementById("query").value.trim();
  const count = document.getElementById("count").value;

  if (!q) return;

  const btn = document.getElementById("searchBtn");
  btn.disabled = true;
  btn.textContent = "Searching...";
  setStatus("Searching...");
  document.getElementById("results").innerHTML = "";
  document.getElementById("download").style.display = "none";

  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(q)}&count=${count}`,
    );
    const data = await res.json();
    currentVideos = data.videos || [];

    if (currentVideos.length === 0) {
      setStatus("no videos found.");
      return;
    }

    setStatus(`Found ${currentVideos.length} video(s)`);
    document.getElementById("download").style.display = "block";
    renderVideos();
  } catch (err) {
    setStatus("Error: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Search";
  }
}

function renderVideos() {
  const grid = document.getElementById("results");
  grid.innerHTML = currentVideos
    .map(
      (v, i) => `
                    <div class="card" id="card-${i}">
                    <img src="${v.thumbnail || ""}"
                        alt="${v.title || "Video"}"
                        onerror="this.style.background='#333'" />
                    <div class="card-body">
                        <h3>${v.title || "Untitled"}</h3>
                        <p class="source">${v.source || ""}
                            · ${v.duration || ""}</p>
                        <button id="btn-${i}"
                        onclick="downloadOne(${i})">Download</button>
                    </div>
                </div>
    `,
    )
    .join("");
}

const searchButton = document.getElementById("searchBtn");
searchButton.addEventListener("click", search);

