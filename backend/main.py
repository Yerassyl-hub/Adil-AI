import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="Adil-AI Backend Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PERPLEXITY_API_KEY = os.environ.get("PERPLEXITY_API_KEY", "")
PERPLEXITY_MODEL = os.environ.get("PERPLEXITY_MODEL", "sonar")
PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/v1/chat")
async def chat(req: Request):
    body = await req.json()
    messages = body.get("messages", [])

    async with httpx.AsyncClient() as client:
        response = await client.post(
            PERPLEXITY_URL,
            headers={
                "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": PERPLEXITY_MODEL,
                "messages": messages,
            },
            timeout=60,
        )
        data = response.json()

    if "error" in data:
        return {"answer": f"Ошибка API: {data['error'].get('message', str(data['error']))}"}

    answer = data["choices"][0]["message"]["content"]

    result = {"answer": answer}

    citations = data.get("citations")
    if citations:
        result["sources"] = [
            {"title": url, "url": url} for url in citations if isinstance(url, str)
        ]

    return result


@app.post("/v1/analyze/contract")
async def analyze_contract(req: Request):
    body = await req.json()
    text = body.get("text", body.get("content", ""))

    messages = [
        {
            "role": "system",
            "content": "Ты — юридический ИИ-ассистент. Проанализируй контракт и выяви риски, проблемные пункты и дай рекомендации.",
        },
        {"role": "user", "content": f"Проанализируй этот контракт:\n\n{text}"},
    ]

    async with httpx.AsyncClient() as client:
        response = await client.post(
            PERPLEXITY_URL,
            headers={
                "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"model": PERPLEXITY_MODEL, "messages": messages},
            timeout=60,
        )
        data = response.json()

    if "error" in data:
        return {"answer": f"Ошибка API: {data['error'].get('message', str(data['error']))}"}

    return {"answer": data["choices"][0]["message"]["content"]}
