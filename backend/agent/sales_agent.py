import os

from dotenv import load_dotenv
from google import genai

from .prompt import SALES_AGENT_PROMPT


load_dotenv()


class SalesAgent:

    def __init__(self):
        self.system_prompt = SALES_AGENT_PROMPT

        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in .env")

        self.client = genai.Client(api_key=api_key)

    def get_prompt(self):
        return self.system_prompt

    def chat(self, user_message):

        response = self.client.models.generate_content(
            model="gemini-3.6-flash",
            contents=f"""
{self.system_prompt}

Customer:
{user_message}

Respond as the SalesFlow AI sales representative.
"""
        )

        return response.text