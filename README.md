# Opportunity Intelligence

A local decision workspace that turns a pasted job description, consulting enquiry, RFP or hackathon brief into structured information to review before committing.

Messy briefs mix requirements, constraints and unanswered questions. This first slice separates them into a practical overview: title/type, extractive summary, requirements, constraints, missing information, risks, assumptions, clarification questions and next actions. Three synthetic examples are included. The responsive UI supports empty, loading, success, validation, network-error and edited-input states.

**This version uses deterministic local keyword rules, not an AI model.** No API key, paid service, internet connection at runtime, or persistent storage is needed. All findings need human review.

## Architecture and stack

Next.js / React / strict TypeScript / Tailwind CSS → FastAPI → `AnalysisService` → `OpportunityAnalyzer` protocol → local rules → Pydantic `OpportunityAnalysis` → browser.

The backend uses Python 3.11+, Pydantic 2, pytest and Ruff. The frontend uses Lucide icons and ESLint. GitHub Actions checks each independently. See [architecture](docs/architecture.md) for data flow, rules, trust boundaries and the future provider seam.

```text
backend/
  src/opportunity_intelligence/  # HTTP, domain, service and rules
  tests/                        # API and behavior tests
  pyproject.toml
frontend/
  app/                          # Next.js page, layout and styles
  components/                   # Workspace and results
  lib/                          # Typed API client
examples/opportunities.json     # Shared public-safe fixtures
docs/architecture.md
.github/workflows/ci.yml
```

## Windows PowerShell setup

Prerequisites: Git, Python 3.11+ and Node.js 24 LTS with npm. Package installation needs internet access. These commands assume the checkout is `D:\GitHub_Dev\vector_build_1`; substitute your path if different. Use two terminals.

### Terminal 1: backend

```powershell
Set-Location D:\GitHub_Dev\vector_build_1\backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m uvicorn opportunity_intelligence.api:app --host 127.0.0.1 --port 8000
```

Calling the virtual environment's executable directly avoids PowerShell activation-policy problems. No execution-policy change is necessary. On this machine, `python` resolves to an unusable Windows Store alias. The environment was created and tested with the following available Python 3.12 executable instead:

```powershell
Set-Location D:\GitHub_Dev\vector_build_1\backend
& 'C:\Users\varad\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m venv .venv
```

Other developers should use their installed Python 3.11+ executable. After creating the environment, the remaining `.venv` commands are the same. For automatic reload during development, append `--reload` to the Uvicorn command.

### Terminal 2: frontend

```powershell
Set-Location D:\GitHub_Dev\vector_build_1\frontend
npm.cmd ci
npm.cmd run dev
```

The API URL defaults to `http://localhost:8000`. Optional configuration:

```powershell
Copy-Item .env.example .env.local
```

Edit `NEXT_PUBLIC_API_BASE_URL` in `.env.local`, then restart the frontend. For production builds, rebuild after changing this value. It is a public setting, not a secret. Optional backend CORS override, before starting Uvicorn:

```powershell
$env:CORS_ORIGINS = 'http://localhost:3000,http://127.0.0.1:3000'
```

Open:

- Workspace: [http://localhost:3000](http://localhost:3000)
- Interactive API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health: [http://localhost:8000/health](http://localhost:8000/health)

Choose an example, click **Analyze opportunity**, and review the results. Editing the brief marks existing results as outdated. Refresh or Clear workspace discards the in-memory workspace.

### Stop and restart

Press **Ctrl+C** in each server terminal. Re-run its startup command to restart; dependency installation and environment creation are only needed on first setup or after dependency changes. Both servers bind to loopback. Nothing is deployed.

## Verification

Backend:

```powershell
Set-Location D:\GitHub_Dev\vector_build_1\backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m ruff format --check .
```

Frontend:

```powershell
Set-Location D:\GitHub_Dev\vector_build_1\frontend
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run start
```

Stop the frontend dev server before running `start`, since both use port 3000. `start` serves the built application; `dev` serves development mode. Frontend checks are separate because Next.js build does not run ESLint.

With the backend running, from the repository root:

```powershell
Invoke-RestMethod http://localhost:8000/health
$example = (Get-Content .\examples\opportunities.json -Raw | ConvertFrom-Json)[0]
$body = @{ text = $example.text } | ConvertTo-Json
Invoke-RestMethod http://localhost:8000/api/v1/opportunities/analyze -Method Post -ContentType 'application/json' -Body $body
```

## Limitations and roadmap

Rules detect English keywords and preserve matching source sentences. They cannot understand negation, verify facts, rank fit, discover implicit requirements or establish that a mentioned topic is adequately specified. The title and summary are excerpts, not generated prose. Missing-information checks cover only commercial terms, timeline, success criteria and decision owner. No risk flags does not mean no risk. Frontend TypeScript mirrors the backend contract manually; it does not perform runtime response schema validation.

No file upload, persistence, accounts, authorization, scoring, proposals, external LLMs, RAG, vector database, analytics or production infrastructure is implemented. This is local software, not a secured hosted API.

Suggested next step: establish a small labeled evaluation set, then add one LLM-backed analyzer behind the existing interface with strict structured output validation, explicit privacy handling and comparison against the deterministic baseline. Later increments may add richer analysis, document upload, RAG/evidence matching, persistence and production deployment after separate design reviews.
