//------------------------------------
// Google Apps Script API
//------------------------------------



async function getGames() {

    try {

        const response = await fetch(CONFIG.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=UTF-8"
          },
          body: JSON.stringify({
            action: "getGames"
          })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        console.log("getGames response:", data);

        if (!data.success) {
            throw new Error(data.message);
        }

        return data.games;

    } catch (error) {

        console.error("Unable to load games:", error);

        return [];

    }

}

async function getPlayers() {

    try {

        const response = await fetch(CONFIG.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=UTF-8"
          },
          body: JSON.stringify({
            action: "getPlayers"
          })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        console.log("getPlayers response:", data);

        if (!data.success) {
            throw new Error(data.message);
        }

        return data.players;

    } catch (error) {

        console.error("Unable to load players:", error);

        return [];

    }

}

async function submitPlay(playSubmission) {
  try {
    const response = await fetch(CONFIG.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8"
      },
      body: JSON.stringify({
        action: "submitPlay",
        ...playSubmission
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.message);
    };

    return data;

  } catch (error) {
    console.error("Unable to submit play:", error);

    return {
      success: false,
      message: "Unable to submit play. Please try again."
    };
  }
}