from fastapi import FastAPI
from agent.sales_agent import SalesAgent

app = FastAPI(title="Voice Sales Agent")

sales_agent = SalesAgent()


@app.get("/")
def home():
    return {
        "message": "SalesFlow AI Sales Agent is running!"
    }


@app.get("/agent")
def agent_info():
    return {
        "agent": "SalesFlow AI",
        "description": sales_agent.get_prompt()
    }