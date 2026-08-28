import os
import time

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from agora_token_builder import RtcTokenBuilder

from agent.sales_agent import SalesAgent


# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()


# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI(title="Voice Sales Agent")


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# SALES AGENT
# ==========================================

sales_agent = SalesAgent()


# ==========================================
# CHAT REQUEST MODEL
# ==========================================

class ChatRequest(BaseModel):
    message: str


# ==========================================
# HOME ROUTE
# ==========================================

@app.get("/")
def home():
    return {
        "message": "SalesFlow AI Sales Agent is running!"
    }


# ==========================================
# CHAT ROUTE
# ==========================================

@app.post("/chat")
def chat(request: ChatRequest):

    response = sales_agent.chat(request.message)

    return {
        "response": response
    }


# ==========================================
# AGORA TOKEN ROUTE
# ==========================================

@app.get("/agora/token")
def generate_agora_token():

    app_id = os.getenv("AGORA_APP_ID")
    app_certificate = os.getenv("AGORA_APP_CERTIFICATE")

    if not app_id:
        return {
            "error": "AGORA_APP_ID is missing in .env"
        }

    if not app_certificate:
        return {
            "error": "AGORA_APP_CERTIFICATE is missing in .env"
        }

    channel_name = "salesflow"
    uid = 0

    privilege_expired_ts = int(time.time()) + 3600

    token = RtcTokenBuilder.buildTokenWithUid(
        app_id,
        app_certificate,
        channel_name,
        uid,
        1,
        privilege_expired_ts
    )

    return {
        "appId": app_id,
        "channel": channel_name,
        "token": token,
        "uid": uid
    }