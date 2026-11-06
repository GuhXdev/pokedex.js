const API = "https://pokeapi.co/api/v2/pokemon/";
const grid = document.querySelector("#pokemon-grid");
const notice = document.querySelector("#notice");
const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const loadMoreButton = document.querySelector("#load-more");
const randomButton = document.querySelector("#random-button");
const dialog = document.querySelector("#pokemon-dialog");
const dialogContent = document.querySelector("#dialog-content");
const dialogClose = document.querySelector("#dialog-close");

const typeLabels = {
  normal: "Normal", fire: "Fogo", water: "Água", electric: "Elétrico", grass: "Planta",
  ice: "Gelo", fighting: "Lutador", poison: "Veneno", ground: "Terra", flying: "Voador",
  psychic: "Psíquico", bug: "Inseto", rock: "Pedra", ghost: "Fantasma", dragon: "Dragão",
  dark: "Sombrio", steel: "Aço", fairy: "Fada"
};
const typeColors = {
  normal: ["#8b929f","#f0f2f5"], fire: ["#ed7548","#fff0e9"], water: ["#548fe8","#eaf2ff"],
  electric: ["#b88a08","#fff7d9"], grass: ["#3d9e6b","#e6f7ed"], ice: ["#4babb2","#e5f8fa"],
  fighting: ["#c34b55","#ffebed"], poison: ["#9a65bd","#f5eafa"], ground: ["#b28a48","#fbf2e2"],
  flying: ["#7384d8","#eef0ff"], psychic: ["#cf5a9e","#ffedf7"], bug: ["#849b37","#f2f7df"],
  rock: ["#9c865e","#f5f0e6"], ghost: ["#7661ad","#f0edff"], dragon: ["#6c62d7","#eeedff"],
  dark: ["#686574","#efedf2"], steel: ["#7b91a4","#edf2f6"], fairy: ["#d67ea8","#fff0f7"]
};
let loadedIds = [];
let offset = 1;
let currentFilter = "all";
let searchMode = false;
let loading = false;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function getTypes(pokemon) { return pokemon.types.map(item => item.type.name); }
function primaryType(pokemon) { return getTypes(pokemon)[0] || "normal"; }
function imageUrl(pokemon) {
  return pokemon.sprites.other?.["official-artwork"]?.front_default ||
    pokemon.sprites.other?.dream_world?.front_default || pokemon.sprites.front_default || "";
}
function setNotice(message) { notice.textContent = message; }

// Fala o nome do Pokémon usando a voz disponível em português brasileiro.
function speakPokemonName(pokemon) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
  window.speechSynthesis.cancel();
  const name = pokemon.name.replace(/-/g, " ");
  const utterance = new SpeechSynthesisUtterance(`Encontrei ${name}!`);
  utterance.lang = "pt-BR";
  utterance.rate = 0.9;
  utterance.pitch = 1.05;
  window.speechSynthesis.speak(utterance);
}
function setTheme(card, type) {
  const colors = typeColors[type] || typeColors.normal;
  card.style.setProperty("--type-color", colors[0]);
  card.style.setProperty("--type-bg", colors[1]);
}
function makeCard(pokemon) {
  const type = primaryType(pokemon);
  const card = document.createElement("button");
  card.type = "button";
  card.className = "pokemon-card";
  card.setAttribute("aria-label", `Ver detalhes de ${pokemon.name}`);
  setTheme(card, type);
  const types = getTypes(pokemon).map(t => `<span class="type-pill">${escapeHtml(typeLabels[t] || t)}</span>`).join("");
  const image = imageUrl(pokemon);
  card.innerHTML = `
    <div class="card-top"><span class="pokemon-number">#${String(pokemon.id).padStart(3,"0")}</span><span class="card-heart" aria-hidden="true">✦</span></div>
    <div class="pokemon-image-wrap">${image ? `<img class="pokemon-image" src="${escapeHtml(image)}" alt="${escapeHtml(pokemon.name)}" loading="lazy">` : `<span>?</span>`}</div>
    <div class="card-info"><h3 class="pokemon-name">${escapeHtml(pokemon.name)}</h3><div class="type-list">${types}</div></div>
    <div class="card-bottom"><span>Altura <strong>${(pokemon.height/10).toFixed(1)} m</strong></span><span>Peso <strong>${(pokemon.weight/10).toFixed(1)} kg</strong></span></div>`;
  card.addEventListener("click", () => showDetails(pokemon));
  return card;
}
function renderPokemon(pokemonList, append = false) {
  if (!append) grid.replaceChildren();
  pokemonList.forEach(p => grid.appendChild(makeCard(p)));
}
async function fetchPokemon(identifier) {
  const response = await fetch(`${API}${encodeURIComponent(identifier.toString().trim().toLowerCase())}`);
  if (!response.ok) throw new Error("Pokémon não encontrado.");
  return response.json();
}
async function loadInitial() {
  loading = true;
  setNotice("Carregando Pokémon...");
  loadMoreButton.disabled = true;
  try {
    const results = await Promise.all(Array.from({length:12}, (_,i) => fetchPokemon(i+1)));
    loadedIds = results.map(p => p.id);
    offset = 13;
    renderPokemon(results);
    setNotice("Mostrando os primeiros Pokémon. Clique em um card para ver os detalhes.");
  } catch {
    setNotice("Não foi possível carregar os Pokémon. Verifique sua conexão e tente novamente.");
  } finally {
    loading = false;
    loadMoreButton.disabled = false;
  }
}
async function loadMore() {
  if (loading || searchMode) return;
  loading = true;
  loadMoreButton.disabled = true;
  loadMoreButton.textContent = "Carregando...";
  try {
    const results = await Promise.all(Array.from({length:12}, (_,i) => fetchPokemon(offset+i)));
    offset += 12;
    loadedIds.push(...results.map(p => p.id));
    const filtered = currentFilter === "all" ? results : results.filter(p => getTypes(p).includes(currentFilter));
    renderPokemon(filtered, true);
    if (currentFilter !== "all" && filtered.length === 0) setNotice("Nenhum resultado deste tipo neste grupo. Carregue mais para continuar.");
    else setNotice(`Exibindo ${grid.children.length} Pokémon.`);
  } catch {
    setNotice("Erro ao carregar mais Pokémon. Tente novamente.");
  } finally {
    loading = false;
    loadMoreButton.disabled = false;
    loadMoreButton.innerHTML = 'Carregar mais <span aria-hidden="true">↓</span>';
  }
}
async function searchPokemon(query) {
  const value = query.trim().toLowerCase().replace(/^#/, "");
  if (!value) { searchMode = false; currentFilter = "all"; updateFilterButtons(); await loadInitial(); return; }
  searchMode = true;
  loadMoreButton.hidden = true;
  setNotice("Procurando Pokémon...");
  grid.classList.add("pokemon-searching");
  grid.classList.remove("pokemon-found");
  grid.replaceChildren();
  try {
    const pokemon = await fetchPokemon(value);
    grid.classList.remove("pokemon-searching");
    renderPokemon([pokemon]);
    grid.classList.remove("pokemon-found");
    void grid.offsetWidth;
    grid.classList.add("pokemon-found");
    setNotice(`Encontramos ${pokemon.name}, o Pokémon #${String(pokemon.id).padStart(3,"0")}.`);
    speakPokemonName(pokemon);
  } catch {
    grid.classList.remove("pokemon-searching");
    setNotice("Pokémon não encontrado. Tente outro nome ou número (de 1 a 1025).");
  }
}
function updateFilterButtons() {
  document.querySelectorAll(".filter-chip").forEach(btn => btn.classList.toggle("active", btn.dataset.type === currentFilter));
}
async function applyFilter(type) {
  currentFilter = type;
  searchMode = false;
  loadMoreButton.hidden = false;
  updateFilterButtons();
  setNotice("Filtrando Pokémon...");
  try {
    const results = await Promise.all(Array.from({length:24}, (_,i) => fetchPokemon(i+1)));
    offset = 25;
    loadedIds = results.map(p => p.id);
    const filtered = type === "all" ? results.slice(0,12) : results.filter(p => getTypes(p).includes(type));
    renderPokemon(filtered);
    setNotice(type === "all" ? `Exibindo ${grid.children.length} Pokémon.` : `${filtered.length} Pokémon do tipo ${typeLabels[type] || type} encontrados neste grupo.`);
  } catch { setNotice("Não foi possível aplicar o filtro. Tente novamente."); }
}
async function showDetails(pokemon) {
  const type = primaryType(pokemon);
  const colors = typeColors[type] || typeColors.normal;
  dialogContent.innerHTML = `<div class="dialog-pokemon" style="--type-bg:${colors[1]}">
    <img src="${escapeHtml(imageUrl(pokemon))}" alt="${escapeHtml(pokemon.name)}">
    <div class="dialog-id">POKÉMON #${String(pokemon.id).padStart(3,"0")}</div>
    <h3>${escapeHtml(pokemon.name)}</h3>
    <div class="type-list dialog-types">${getTypes(pokemon).map(t => `<span class="type-pill" style="--type-color:${(typeColors[t]||typeColors.normal)[0]};--type-bg:${(typeColors[t]||typeColors.normal)[1]}">${escapeHtml(typeLabels[t]||t)}</span>`).join("")}</div>
    <div class="stats">
      <div class="stat"><span>Altura</span><strong>${(pokemon.height/10).toFixed(1)} m</strong></div>
      <div class="stat"><span>Peso</span><strong>${(pokemon.weight/10).toFixed(1)} kg</strong></div>
      ${pokemon.stats.slice(0,4).map(s => `<div class="stat"><span>${escapeHtml(s.stat.name.replace("-", " "))}</span><strong>${s.base_stat}</strong></div>`).join("")}
    </div></div>`;
  if (!dialog.open) dialog.showModal();
}
form.addEventListener("submit", e => { e.preventDefault(); searchPokemon(input.value); });
document.querySelectorAll("[data-search]").forEach(btn => btn.addEventListener("click", () => {
  input.value = btn.dataset.search;
  searchPokemon(btn.dataset.search);
}));
document.querySelectorAll(".filter-chip").forEach(btn => btn.addEventListener("click", () => applyFilter(btn.dataset.type)));
loadMoreButton.addEventListener("click", loadMore);
randomButton.addEventListener("click", async () => {
  const id = Math.floor(Math.random()*1025)+1;
  input.value = "";
  searchMode = true;
  loadMoreButton.hidden = true;
  setNotice("Sorteando um Pokémon...");
  try {
    const pokemon = await fetchPokemon(id);
    renderPokemon([pokemon]);
    grid.classList.remove("pokemon-found");
    void grid.offsetWidth;
    grid.classList.add("pokemon-found");
    setNotice("Pokémon aleatório encontrado! Clique no card para ver mais detalhes.");
    speakPokemonName(pokemon);
    showDetails(pokemon);
  } catch { setNotice("Não foi possível sortear agora. Tente novamente."); }
});
dialogClose.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
loadInitial();
