//------------------------------------
// State
//------------------------------------

let allGames = [];

// Temporary test data
const sampleGames = [
    {
        GameId: "PTW001",
        Title: "The Druids of Edora",
        Publisher: "Alea",
        BGGId: "440007",
        ImageUrl: "https://cf.geekdo-images.com/placeholder.jpg"
    }
];

//------------------------------------
// Startup
//------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    setupSearch();

    // For now, use sample data.
    // Later this will become: loadGames();
    allGames = sampleGames;
    renderGames(allGames);
    document.getElementById("addPlayerButton").addEventListener("click", addPlayerRow);
});

//------------------------------------
// Search
//------------------------------------

function setupSearch() {
    const searchInput = document.getElementById("searchInput");

    searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value.toLowerCase().trim();

        const filteredGames = allGames.filter(game =>
            game.Title.toLowerCase().includes(searchTerm) ||
            game.Publisher.toLowerCase().includes(searchTerm)
        );

        renderGames(filteredGames);
    });
}

//------------------------------------
// Render Games
//------------------------------------

function renderGames(games) {
    const gameGrid = document.getElementById("gameGrid");

    gameGrid.innerHTML = "";

    if (!games.length) {
        gameGrid.innerHTML = `
            <div class="placeholder-card">
                <h2>No Games Found</h2>
                <p>Try searching for a different title or publisher.</p>
            </div>
        `;
        return;
    }

    games.forEach(game => {
        const card = createGameCard(game);
        gameGrid.appendChild(card);
    });
}

function createGameCard(game) {
    const card = document.createElement("article");
    card.className = "game-card";

    const bggUrl = `https://boardgamegeek.com/boardgame/${game.BGGId}`;
    const thumbnailUrl = game.ThumbnailUrl || "images/game-placeholder.png";

    card.innerHTML = `
        <a
            class="game-image-link"
            href="${bggUrl}"
            target="_blank"
            rel="noopener noreferrer"
            title="View ${game.Title} on BoardGameGeek"
            aria-label="View ${game.Title} on BoardGameGeek"
        >
            <div class="game-image-wrap">
                <img
                    src="${thumbnailUrl}"
                    alt="${game.Title} box cover"
                    class="game-image"
                >
            </div>
        </a>

        <div class="game-card-content">
            <h2 class="game-title">${game.Title}</h2>
            <p class="game-publisher">${game.Publisher}</p>

            <button
                class="game-button"
                data-game-id="${game.GameId}"
            >
                Record Play
            </button>
        </div>
    `;

    const recordButton = card.querySelector(".game-button");

    recordButton.addEventListener("click", () => {
        openRecordPlayModal(game);
    });

    return card;
}

//------------------------------------
// Record Play Placeholder
//------------------------------------

let activeGame = null;
let playerRowCount = 0;

function openRecordPlayModal(game) {
    activeGame = game;
    playerRowCount = 0;

    document.getElementById("modalGameTitle").textContent = game.Title;
    document.getElementById("modalGamePublisher").textContent = game.Publisher;

    const playerRows = document.getElementById("playerRows");
    playerRows.innerHTML = "";

    addPlayerRow();

    document.getElementById("recordPlayModal").classList.remove("hidden");
}

function closeRecordPlayModal() {
    document.getElementById("recordPlayModal").classList.add("hidden");
}

function addPlayerRow() {
    playerRowCount++;

    const playerRows = document.getElementById("playerRows");

    const row = document.createElement("div");
    row.className = "player-row";

    row.innerHTML = `
        <div class="player-row-header">
            <span class="player-row-title">Player ${playerRowCount}</span>

            ${
                playerRowCount > 1
                    ? `<button type="button" class="remove-player-button">Remove</button>`
                    : ""
            }
        </div>

        <div class="form-grid">
            <div class="form-field">
                <label>Badge #</label>
                <input type="text" name="badgeNumber" required>
            </div>

            <div class="form-field">
                <label>First Name</label>
                <input type="text" name="firstName" required>
            </div>

            <div class="form-field">
                <label>Last Name</label>
                <input type="text" name="lastName" required>
            </div>

            <div class="form-field">
                <label>Email</label>
                <input type="email" name="email" required>
            </div>

            <div class="form-field full-width">
                <label>How much would you like to win this game?</label>
                <select name="rank" required>
                    <option value="">Select ranking...</option>
                    <option value="5">5 — Very much want to win</option>
                    <option value="4">4 — Would be excited to win</option>
                    <option value="3">3 — Would enjoy winning</option>
                    <option value="2">2 — Mildly interested</option>
                    <option value="1">1 — Do not want to win this game</option>
                </select>
            </div>
        </div>
    `;

    const removeButton = row.querySelector(".remove-player-button");

    if (removeButton) {
        removeButton.addEventListener("click", () => {
            row.remove();
        });
    }

    playerRows.appendChild(row);
}