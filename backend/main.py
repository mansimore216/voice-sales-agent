from fastapi import FastAPI
from pydantic import BaseModel

from agent.sales_agent import SalesAgent


app = FastAPI(title="Voice Sales Agent")

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