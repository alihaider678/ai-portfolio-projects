# Hermes Agent Integration

Wires the **Nous Research Hermes Agent** (Docker) to the TariffLens **MCP
server** (host). Hermes discovers the classification tools over MCP and calls
them when asked, in plain English, to classify a product or look up a duty.

```
  Hermes Agent (Docker container)  ──HTTP/MCP──▶  TariffLens MCP server (host :8021)
  free Nous-Portal model                          classify_product / get_duty_rate /
  reasons + calls tools                           get_hs_details  (hybrid RAG over
                                                   the real USITC HTS schedule)
```

## Prerequisites
- **Docker Desktop** running.
- Project `.venv` set up, data ingested, and `build_index.py` run (embeddings.npy present).
- A project `.env` with `OPENAI_API_KEY` (the MCP server uses it for embeddings + reranking).
- A **Nous Portal** login (free — from `hermes setup`; reused across projects).

Commands are for **PowerShell** (Windows). The mount `-v "$HOME\.hermes:/opt/data"`
persists Hermes' config + login between runs.

## Steps

### 1. Start the TariffLens MCP server on the host (HTTP mode)
```powershell
cd ..\mcp_server
..\.venv\Scripts\python.exe server.py --http --port 8021
```
Leave it running. (It reads `OPENAI_API_KEY` from the project `.env`.)

### 2. Register the server with Hermes
```powershell
"`ny`n" | docker run --rm -i -v "$HOME\.hermes:/opt/data" --entrypoint hermes `
  nousresearch/hermes-agent:latest mcp add tarifflens --url http://host.docker.internal:8021/mcp
```
The piped `` "`ny`n" `` answers the prompts (blank auth token, then `y` to enable
all tools). Verify:
```powershell
docker run --rm -v "$HOME\.hermes:/opt/data" --entrypoint hermes nousresearch/hermes-agent:latest mcp test tarifflens
```
Expected: `✓ Connected` and `✓ Tools discovered: 3`.

### 3. Use it — natural-language classification
```powershell
docker run -it --rm -v "$HOME\.hermes:/opt/data" nousresearch/hermes-agent:latest chat
```
Then ask:
> "Classify 'waterproof leather hiking boots with rubber soles' and tell me the US duty rate."
> "What's the HS code for a lithium-ion battery for electric vehicles, and its duty?"

Hermes discovers the `tarifflens` tools, calls `classify_product` (and often
`get_duty_rate` to confirm the rate), and returns a reasoned answer — proving
MCP + Hermes Agent working together over a hybrid-RAG classification tool.

## Notes
- `host.docker.internal` is how the container reaches the host on Docker Desktop.
- The MCP server (step 1) must be running before Hermes connects.
- Free Nous model is already configured (`stepfun/step-3.7-flash:free`).
- Remove the server: `hermes mcp remove tarifflens`.