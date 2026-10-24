# MedBridge

A single‑folder full‑stack project that combines a **FastAPI** backend with a compiled **React** frontend. It provides:

- Hospital and prescription management APIs with JWT authentication.
- MongoDB integration.
- Static serving of the React UI from `backend/frontend`.

## Project Structure
```
medbridge/
├─ backend/               # FastAPI code
│   ├─ app.py             # Entry point, serves static UI
│   ├─ ucs_routes/        # API routers (hospital, prescription)
│   ├─ utils/             # Auth, DB helpers
│   ├─ requirements.txt   # Python deps (fastapi, uvicorn, pymongo, python‑jose, ...)
│   └─ frontend/          # Compiled React build (dist folder)
├─ .gitignore
└─ README.md              # This file
```

## Quick Start (see `run_guide.md` for full commands)
1. **Clone** the repo.
2. Open the folder in VS Code.
3. Set up the backend:
   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```
4. Export environment variables (JWT secret, MongoDB connection).
5. Ensure MongoDB is running.
6. Launch the server:
   ```powershell
   python app.py serve
   ```
7. Open `http://127.0.0.1:8000/` in a browser.

## GitHub Setup
```bash
# Initialize a new repo (if not already)
git init
git add .
git commit -m "Initial commit – MedBridge full stack"
# Create a remote repository on GitHub (replace USER/REPO)
# Then push:
git remote add origin https://github.com/USER/REPO.git
git branch -M main
git push -u origin main
```

## License
MIT – feel free to modify and redistribute.
