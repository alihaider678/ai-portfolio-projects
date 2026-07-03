# Hermes Agent Integration

This wires the **Nous Research Hermes Agent** (running in Docker) to our custom
**MCP screening server** (running on the host). Hermes discovers the screening
tools over MCP and calls them when asked to screen an entity — in natural language.

```
  Hermes Agent (Docker container)  ──HTTP/MCP──▶  AegisScreen MCP server (host :8020)
  free Nous-Portal model                          screen_entity / batch_screen /
  reasons + calls tools                           get_entity_details over real
                                                   OFAC + OpenSanctions data
```

> ✅ **Verified working.** Asked *"Screen Rosoboronexport against sanctions and PEP
> lists"*, Hermes autonomously called `screen_entity` on this server and returned
> **CRITICAL** (score 100, alias match on the OFAC SDN list, programs EO-14024 /
> UKRAINE-EO13662 / Iran arms).

## Prerequisites
- **Docker Desktop** running.
- The MCP server dependencies installed (project `.venv`) and data ingested
  (`python ingest.py` — loads OFAC SDN + OpenSanctions PEP into `data/`).
- A **Nous Portal** login (free OAuth — created during `hermes setup`). No API
  keys or credit card needed if you use a free model (see step 4).

All Docker commands below are written for **PowerShell** (Windows). The mount
`-v "$HOME\.hermes:/opt/data"` persists Hermes' config + login between runs.

---

## Steps

### 1. Start the MCP screening server on the host (HTTP mode)
```powershell
cd ..\mcp_server
..\.venv\Scripts\python.exe server.py --http --port 8020
```
Leave it running. It listens on `0.0.0.0:8020` and its DNS-rebinding protection
is configured to trust `host.docker.internal` (how the container reaches the
host on Docker Desktop). If Windows Firewall prompts, allow Python.

### 2. Pull the Hermes image
```powershell
docker pull nousresearch/hermes-agent:latest
```

### 3. One-time setup wizard (creates config + Nous login)
```powershell
docker run -it --rm -v "$HOME\.hermes:/opt/data" nousresearch/hermes-agent setup
```
Choose **Full setup**, then provider **Nous Portal** (free OAuth — a browser
opens, sign in, done). This writes `~/.hermes/config.yaml` and saves the login
token in `~/.hermes/auth.json`.

### 4. Pick a model
The account starts at **$0 balance**, so paid models are blocked. Use the one
free model (no credits required):
```powershell
docker run --rm -v "$HOME\.hermes:/opt/data" --entrypoint hermes `
  nousresearch/hermes-agent:latest config set model.default "stepfun/step-3.7-flash:free"
```
*(For higher-quality reasoning — e.g. `anthropic/claude-sonnet-5` — add a few
dollars of credit at https://portal.nousresearch.com and set that model id
instead. A screening query costs ~1-2 cents.)*

### 5. Register this MCP server with Hermes
With the server from step 1 running:
```powershell
"`ny`n" | docker run --rm -i -v "$HOME\.hermes:/opt/data" --entrypoint hermes `
  nousresearch/hermes-agent:latest mcp add aegisscreen --url http://host.docker.internal:8020/mcp
```
The piped `` "`ny`n" `` answers the two prompts: blank = no auth token, `y` =
enable all discovered tools. Hermes connects, discovers the 3 tools, and saves
them. Verify:
```powershell
docker run --rm -v "$HOME\.hermes:/opt/data" --entrypoint hermes nousresearch/hermes-agent:latest mcp list
docker run --rm -v "$HOME\.hermes:/opt/data" --entrypoint hermes nousresearch/hermes-agent:latest mcp test aegisscreen
```
Expected: `aegisscreen ... enabled` and `Connected ... Tools discovered: 3`.

### 6. Use it - natural-language screening
One-shot (great for a recording/screenshot):
```powershell
docker run --rm -v "$HOME\.hermes:/opt/data" nousresearch/hermes-agent:latest `
  -z "Use the aegisscreen tools to screen 'Rosoboronexport' against sanctions and PEP lists. Report the overall risk and any matches."
```
Or an interactive chat session:
```powershell
docker run -it --rm -v "$HOME\.hermes:/opt/data" nousresearch/hermes-agent:latest chat
```
Then try:
> "Screen Rosoboronexport against sanctions and PEP lists."
> "Batch screen these parties: Vladimir Putin, Acme Fresh Foods LLC, Kim Jong Un."

Hermes discovers the `aegisscreen` tools, calls `screen_entity` / `batch_screen`,
and returns an explained risk assessment - proving MCP + Hermes Agent working
together over real sanctions data.

## Notes
- `host.docker.internal` is how the container reaches the host on Docker Desktop.
- The MCP server (step 1) must be running before Hermes connects or screens.
- The container auto-runs a config migration + skill sync on start (normal noise).
- Change model anytime: `config set model.default "<id>"`. List free models by
  querying `<inference_base_url>/models` with your token, or run `hermes model`
  (interactive picker; `/` searches).
- Remove the server: `hermes mcp remove aegisscreen`.