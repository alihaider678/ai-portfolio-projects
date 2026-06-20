# Project 11 — Multimodal Medical Reference Agent

**Domain:** Healthcare / Pharma  
**Tech Stack:** Claude Vision API + OpenAI Whisper + LangChain + Multimodal RAG + ElevenLabs TTS  
**Status:** Planning

## Overview

Three combined capabilities in one medical AI system:

### Capability 1 — Prescription Reader
- Input: Photo of handwritten prescription (image) OR voice dictation (audio)
- Process: Claude Vision reads image / Whisper transcribes audio → extracts drug names + dosages → checks interactions
- Output: Voice warning via ElevenLabs + PDF safety report

### Capability 2 — Mixed PDF Intelligence
- Input: PDF containing images + text + tables (drug guides, medical protocols)
- Process: Parses and extracts both text AND embedded images per section
- Output: Linked image+text pairs stored in knowledge base

### Capability 3 — Multimodal RAG Retrieval
- Knowledge base structure: every chunk = image + text pair
  - Step 1 → [Procedure Image 1] + [Text Instruction 1]
  - Step 2 → [Procedure Image 2] + [Text Instruction 2]
- Query: "Show me Step 2 of insulin injection"
- Output: Retrieves Step 2 image + Step 2 text together — not text alone

## Inputs / Outputs

| Type | Input | Output |
|------|-------|--------|
| Prescription | Image / Audio | Voice warning + PDF report |
| PDF | Mixed content PDF | Multimodal knowledge base |
| Query | Text / Voice | Step image + text + voice explanation |

## Folder Structure

```
src/        - source code
docs/       - architecture diagrams, notes, API docs
```

## Setup

```bash
# Add setup instructions here
```

## Demo

> Add demo link / screenshots here.
