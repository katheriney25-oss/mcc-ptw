//------------------------------------
// State
//------------------------------------

let allGames = [];
let allPlayers = [];
let playerLookup = new Map();


//------------------------------------
// Startup
//------------------------------------

document.addEventListener("DOMContentLoaded", async() => {
    setupSearch();

    
    await loadGames();
    await loadPlayers();


    document
        .getElementById("addPlayerButton")
        .addEventListener("click", addPlayerRow);

    document
        .getElementById("recordPlayForm")
        .addEventListener("submit", handleRecordPlaySubmit);

});

//------------------------------------
// Load data
//------------------------------------

async function loadGames() {
    const games = await getGames();

    allGames = Array.isArray(games) ? games : [];

    renderGames(allGames);
}

async function loadPlayers() {

    const players = await getPlayers();

    allPlayers = Array.isArray(players) ? players : [];

    playerLookup.clear();

    allPlayers.forEach(player => {
        playerLookup.set(String(player.BadgeNumber), player);
    });

    console.log(`${allPlayers.length} players loaded.`);
}


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
    const thumbnailUrl = 
        game.ThumbnailUrl ||
        game.ImageUrl ||
        "images/game-placeholder.png";

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
    const modal = document.getElementById("recordPlayModal");
    const form = document.getElementById("recordPlayForm");
    const playerRows = document.getElementById("playerRows");

    modal.classList.add("hidden");

    form.reset();
    playerRows.innerHTML = "";

    activeGame = null;
    playerRowCount = 0;
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

            <div class="form-field full-width player-search-field">
                <label>Player</label>

                <input
                    type="text"
                    name="playerSearch"
                    class="player-search-input"
                    placeholder="Start typing badge number or name..."
                    autocomplete="off"
                    required
                >

                <input
                    type="hidden"
                    name="badgeNumber"
                >

                <div class="player-search-results hidden"></div>
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

    setupPlayerAutocomplete(row);

    const removeButton = row.querySelector(".remove-player-button");

    if (removeButton) {
        removeButton.addEventListener("click", () => {
            row.remove();
            renumberPlayerRows();
        });
    }

    playerRows.appendChild(row);

}

//------------------------------------
// Player Autocomplete
//------------------------------------

function setupPlayerAutocomplete(row) {
    const searchInput = row.querySelector('[name="playerSearch"]');
    const badgeInput = row.querySelector('[name="badgeNumber"]');
    const resultsPanel = row.querySelector(".player-search-results");

    searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value.toLowerCase().trim();

        // Any manual typing invalidates the previous selection.
        badgeInput.value = "";

        if (!searchTerm) {
            hidePlayerResults(resultsPanel);
            return;
        }

        const matchingPlayers = allPlayers
            .filter(player => {
                const badgeNumber = String(player.BadgeNumber).toLowerCase();
                const firstName = String(player.FirstName).toLowerCase();
                const lastName = String(player.LastName).toLowerCase();
                const fullName = `${firstName} ${lastName}`;

                return (
                    badgeNumber.includes(searchTerm) ||
                    firstName.includes(searchTerm) ||
                    lastName.includes(searchTerm) ||
                    fullName.includes(searchTerm)
                );
            })
            .slice(0, 10);

        renderPlayerResults(
            matchingPlayers,
            searchInput,
            badgeInput,
            resultsPanel
        );
    });

    searchInput.addEventListener("focus", () => {
        if (searchInput.value.trim() && !badgeInput.value) {
            searchInput.dispatchEvent(new Event("input"));
        }
    });

    searchInput.addEventListener("blur", () => {
        window.setTimeout(() => {
            hidePlayerResults(resultsPanel);
        }, 150);
    });
}


function renderPlayerResults(
    players,
    searchInput,
    badgeInput,
    resultsPanel
) {
    resultsPanel.innerHTML = "";

    if (!players.length) {
        resultsPanel.innerHTML = `
            <div class="player-search-empty">
                No matching players found.
            </div>
        `;

        resultsPanel.classList.remove("hidden");
        return;
    }

    players.forEach(player => {
        const option = document.createElement("button");

        option.type = "button";
        option.className = "player-search-option";

        const displayName =
            `${player.BadgeNumber} — ${player.FirstName} ${player.LastName}`;

        option.textContent = displayName;

        option.addEventListener("mousedown", event => {
            event.preventDefault();

            searchInput.value = displayName;
            badgeInput.value = String(player.BadgeNumber);

            hidePlayerResults(resultsPanel);
        });

        resultsPanel.appendChild(option);
    });

    resultsPanel.classList.remove("hidden");
}


function hidePlayerResults(resultsPanel) {
    resultsPanel.classList.add("hidden");
    resultsPanel.innerHTML = "";
}

function renumberPlayerRows() {
    const rows = document.querySelectorAll("#playerRows .player-row");

    rows.forEach((row, index) => {
        const title = row.querySelector(".player-row-title");

        if (title) {
            title.textContent = `Player ${index + 1}`;
        }
    });

    playerRowCount = rows.length;
}


//------------------------------------
// Submit Recorded Play
//------------------------------------

async function handleRecordPlaySubmit(event) {
    event.preventDefault();

    if (!activeGame) {
        alert("No game is currently selected.");
        return;
    }

    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');

    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const playerRows = form.querySelectorAll(".player-row");

    const players = Array.from(playerRows).map(row => ({
    badgeNumber: row
        .querySelector('[name="badgeNumber"]')
        .value
        .trim(),

    rank: Number(
        row.querySelector('[name="rank"]').value
    )
}));

    const playSubmission = {
        gameId: activeGame.GameId,
        players
    };

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {
        console.log("Play submission:", playSubmission);


        const result = await submitPlay(playSubmission);

        if (!result.success) {
            throw new Error(result.message || "Unable to submit play.");
        }
        

        alert(
            `Play recorded for ${activeGame.Title} with ${players.length} player${
                players.length === 1 ? "" : "s"
            }.`
        );

        closeRecordPlayModal();
    } catch (error) {
        console.error("Play submissions failed:", error);

        alert(
            error.message ||
            "Something went wrong while recording the play."
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Play";
    }
}