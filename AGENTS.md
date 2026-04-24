# Repository Guidelines

## Project Structure & Module Organization
This repository is a small local dashboard served by a single Python entrypoint. `server.py` hosts the HTTP server, exposes `/api/items`, and persists dashboard content to `data/board.json`. Static client files live in `public/`: `index.html` and `index.js` power the display page, `admin.html` and `admin.js` power the editor, and `style.css` contains shared styling. `start_dashboard.bat` is the Windows launcher for local use.

## Build, Test, and Development Commands
Use the built-in Python runtime; there is no package manager or build pipeline in this repo.

- `py server.py` starts the local server on port `8787`.
- `start_dashboard.bat` launches the same server from Explorer or a shell.
- `curl http://127.0.0.1:8787/api/items` verifies the JSON API is responding.

After starting the server, check `http://127.0.0.1:8787/` for the dashboard and `http://127.0.0.1:8787/admin` for the editor.

## Coding Style & Naming Conventions
Follow the existing style in each language.

- Python: 4-space indentation, type hints where useful, `snake_case` for functions, constants in `UPPER_CASE`.
- JavaScript: 2-space indentation, `camelCase` for variables/functions, `const` by default, and small single-purpose functions.
- CSS: keep shared variables in `:root`, use descriptive kebab-case class names such as `.board-item-value`.

Preserve UTF-8 handling because the UI content is primarily Traditional Chinese.

## Testing Guidelines
There is no automated test suite in the current repository. Verify changes manually before submitting:

- start the server,
- load both `/` and `/admin`,
- save sample lines in `左邊|右邊` format,
- confirm `data/board.json` updates and the dashboard refreshes correctly.

If you add automated tests later, place them in a top-level `tests/` directory and name files `test_*.py`.

## Commit & Pull Request Guidelines
Git history is not available in this checkout, so follow a simple convention: use short imperative commit subjects such as `Add admin refresh validation` or `Fix board empty state rendering`.

Pull requests should include:

- a brief summary of behavior changes,
- manual test steps and results,
- screenshots for UI changes,
- notes on any `data/board.json` schema changes or migration impact.
