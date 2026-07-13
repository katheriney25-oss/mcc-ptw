//------------------------------------
// State
//------------------------------------

const PLAYER_PROFILE_KEY = "mccPTWPlayerBadge2026";

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

    wirePlayerPlaysModal();

    setupPlayerProfile();
    loadSavedPlayerProfile();


    document
        .getElementById("addPlayerButton")
        .addEventListener("click", addPlayerRow);

    document
        .getElementById("recordPlayForm")
        .addEventListener("submit", handleRecordPlaySubmit);

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closePlayerPlaysModal();
        }
    })

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
        playerLookup.set(
            String(player.BadgeNumber).trim(), 
            player
        );
    });

    console.log(`${allPlayers.length} players loaded.`);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

//------------------------------------
// Player Profile
//------------------------------------

function setupPlayerProfile() {
    const profileSection =
        document.getElementById("playerProfileSection");

    setupPlayerAutocomplete(
        profileSection,
        player => {
            savePlayerProfile(player.BadgeNumber);
            displayPlayerProfile(player);
        }
    );
}



function findPlayerByBadge(badgeNumber) {
    return playerLookup.get(String(badgeNumber).trim());
}

function savePlayerProfile(badgeNumber) {
    localStorage.setItem(PLAYER_PROFILE_KEY, String(badgeNumber).trim());
}

function loadSavedPlayerProfile() {
    const savedBadgeNumber =
        localStorage.getItem(PLAYER_PROFILE_KEY);

    if (!savedBadgeNumber) return;

    const player = findPlayerByBadge(savedBadgeNumber);

    if (!player) {
        localStorage.removeItem(PLAYER_PROFILE_KEY);
        return;
    }

    const profileSection =
        document.getElementById("playerProfileSection");

    const searchInput =
        profileSection.querySelector('[name="playerSearch"]');

    const badgeInput =
        profileSection.querySelector('[name="badgeNumber"]');

    searchInput.value =
        `${player.BadgeNumber} — ${player.FirstName} ${player.LastName}`;

    badgeInput.value = String(player.BadgeNumber);

    displayPlayerProfile(player);
}
function displayPlayerProfile(player) {
    const profileDisplay = 
        document.getElementById("playerProfile");

    const totalPlays = Number(player.TotalPlays) || 0;

    const playLabel = 
        totalPlays === 1
            ? "Play Entry"
            : "Play Entries";

    profileDisplay.innerHTML = `
        <div class="player-profile-success">
            <strong>
                Welcome, ${player.FirstName} ${player.LastName}!
            </strong>

            <button
                type="button"
                class="player-play-count-button"
            >
                🎲 ${totalPlays} ${playLabel}
            </button>

        </div>
    `;

    const playCountButton = profileDisplay.querySelector(
    ".player-play-count-button"
    );

    if (!playCountButton) return;

    playCountButton.addEventListener("click", () => {
        openPlayerPlaysModal(
            player.BadgeNumber,
            `${player.FirstName} ${player.LastName}`
            );
        });
    }



function displayPlayerProfileError(message) {
    const profileDisplay = 
        document.getElementById("playerProfile");

    profileDisplay.innerHTML = `
        <div class="player-profile-error">
            ${message}
        </div>
    `;
}

function clearPlayerProfile() {
    localStorage.removeItem(PLAYER_PROFILE_KEY);

    document.getElementById("playerProfile").innerHTML = "";
}

async function openPlayerPlaysModal(badgeNumber, playerName) {
    const modal = document.getElementById("playerPlaysModal");
    const modalTitle = document.getElementById(
        "playerPlaysModalTitle"
    );
    const modalBody = document.getElementById(
        "playerPlaysModalBody"
    );

    if (!modal || !modalTitle || !modalBody) return;

    modalTitle.textContent = `${playerName} — Play History`;

    modalBody.innerHTML = `
        <div class="player-plays-loading">
            Loading play history...
        </div>
    `;

    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");

    try {
        const result = await getPlayerPlays(badgeNumber);

        renderPlayerPlays(result.games, result.totalPlays);
    } catch (error) {
        console.error("Unable to load player plays:", error);

        modalBody.innerHTML = `
            <div class="player-plays-message player-plays-error">
                We couldn't load this player's play history.
                Please try again.
            </div>
        `;
    }
}

function wirePlayerPlaysModal() {
    const closeButton = document.getElementById(
        "closePlayerPlaysModalButton"
    );

    const okButton = document.getElementById(
        "closePlayerPlaysOkButton"
    );

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closePlayerPlaysModal
        );
    }

    if (okButton) {
        okButton.addEventListener(
            "click",
            closePlayerPlaysModal
        );
    }
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

    const totalPlays = Number(game.TotalPlays) || 0;

    const playEntryLabel = 
        totalPlays === 1
            ? "Play Entry"
            : "Play Entries";

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

            <div class="game-play-count">
                <span aria-hidden="true">🎲</span>
                ${totalPlays} ${playEntryLabel}
            </div>


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

function renderPlayerPlays(games, totalPlays) {
    const modalBody = document.getElementById(
        "playerPlaysModalBody"
    );

    if (!modalBody) return;

    if (!games || games.length === 0) {
        modalBody.innerHTML = `
            <div class="player-plays-message">
                No play entries have been recorded yet.
            </div>
        `;

        return;
    }

    const uniqueGameCount = games.length;

    modalBody.innerHTML = `
        <div class="player-plays-summary">
            <div>
                <span>Total Play Entries</span>
                <strong>${totalPlays}</strong>
            </div>

            <div>
                <span>Different Games</span>
                <strong>${uniqueGameCount}</strong>
            </div>
        </div>

        <div class="player-plays-list">
            ${games.map(game => `
                <div class="player-play-history-row">
                    <div class="player-play-history-game">
                        <strong>${escapeHtml(game.title)}</strong>

                        ${
                            game.publisher
                                ? `<span>${escapeHtml(game.publisher)}</span>`
                                : ""
                        }
                    </div>

                    <div class="player-play-history-count">
                        <strong>${game.playCount}</strong>
                        <span>
                            ${game.playCount === 1 ? "play" : "plays"}
                        </span>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function closePlayerPlaysModal() {
    const modal = document.getElementById("playerPlaysModal");

    if (!modal) return;

    modal.classList.add("hidden");
    document.body.classList.remove("modal-open");
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

    // Automatically populate Player 1 with the saved profile.
if (playerRowCount === 1) {
    const savedBadgeNumber = localStorage.getItem(PLAYER_PROFILE_KEY);

    if (savedBadgeNumber) {
        const player = findPlayerByBadge(savedBadgeNumber);

        if (player) {
            row.querySelector('[name="playerSearch"]').value =
                `${player.BadgeNumber} — ${player.FirstName} ${player.LastName}`;

            row.querySelector('[name="badgeNumber"]').value =
                player.BadgeNumber;
        }
    }
}

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

function setupPlayerAutocomplete(
    row,
    onPlayerSelected = null
) {
    const searchInput =
        row.querySelector('[name="playerSearch"]');

    const badgeInput =
        row.querySelector('[name="badgeNumber"]');

    const resultsPanel =
        row.querySelector(".player-search-results");

    searchInput.addEventListener("input", () => {
        const searchTerm =
            searchInput.value.toLowerCase().trim();

        // Manual typing invalidates the previous selection.
        badgeInput.value = "";

        if (onPlayerSelected) {
            clearPlayerProfile();
        }

        if (!searchTerm) {
            hidePlayerResults(resultsPanel);
            return;
        }

        const matchingPlayers = allPlayers
            .filter(player => {
                const badgeNumber =
                    String(player.BadgeNumber).toLowerCase();

                const firstName =
                    String(player.FirstName).toLowerCase();

                const lastName =
                    String(player.LastName).toLowerCase();

                const fullName =
                    `${firstName} ${lastName}`;

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
            resultsPanel,
            onPlayerSelected
        );
    });

    searchInput.addEventListener("focus", () => {
        if (
            searchInput.value.trim() &&
            !badgeInput.value
        ) {
            searchInput.dispatchEvent(
                new Event("input")
            );
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
    resultsPanel,
    onPlayerSelected = null
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

            if (typeof onPlayerSelected === "function") {
                onPlayerSelected(player);
            }
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

        await loadGames();
        await loadPlayers();
        loadSavedPlayerProfile();

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