type EnterGameResponse = {
  game: {
    id: number;
  };
};

async function enterGame(): Promise<void> {
  try {
    const response = await fetch("/api/games", {
      method: "POST",
    });

    if (!response.ok) {
      console.error("Failed to enter game");
      return;
    }

    const data = (await response.json()) as EnterGameResponse;
    window.location.href = "/games/" + String(data.game.id);
  } catch (err) {
    console.error("Error entering game:", err);
  }
}

function setupCreateGameButton(createBtn: HTMLButtonElement): void {
  createBtn.addEventListener("click", (): void => {
    void enterGame();
  });
}

function main(): void {
  const createBtnElement = document.getElementById("create-game");

  if (!(createBtnElement instanceof HTMLButtonElement)) {
    console.error("Missing #create-game element.");
    return;
  }

  setupCreateGameButton(createBtnElement);
}

main();
