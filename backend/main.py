from fastapi import FastAPI
from pydantic import BaseModel

from agent.sales_agent import SalesAgent
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Voice Sales Agent")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sales_agent = SalesAgent()


class ChatRequest(BaseModel):
    message: str


@app.get("/")
def home():
    return {
        "message": "SalesFlow AI Sales Agent is running!"
    }


@app.post("/chat")
def chat(request: ChatRequest):

    response = sales_agent.chat(request.message)

    return {
        "response": response
    }