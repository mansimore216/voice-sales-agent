import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

from .prompt import SALES_AGENT_PROMPT
from memory.session_memory import SessionMemory
from tools.product_tool import get_product_info


load_dotenv()


class SalesAgent:

    def __init__(self):
        self.system_prompt = SALES_AGENT_PROMPT

        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in .env")

        self.client = genai.Client(api_key=api_key)

        self.memory = SessionMemory()

        self.product_tool = types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="get_product_info",
                    description=(
                        "Get information about SalesFlow CRM, "
                        "including features, target customers, "
                        "and benefits."
                    ),
                    parameters=types.Schema(
                        type="OBJECT",
                        properties={}
                    )
                )
            ]
        )

    def get_prompt(self):
        return self.system_prompt

    def chat(self, user_message):

        # Save user message
        self.memory.add_message(
            "user",
            user_message
        )

        # Build conversation text
        conversation = self.memory.get_messages()

        conversation_text = ""

        for message in conversation:
            conversation_text += (
                f"{message['role']}: "
                f"{message['content']}\n"
            )

        # First LLM call
        response = self.client.models.generate_content(
            model="gemini-3.6-flash",

            contents=f"""
{self.system_prompt}

Conversation so far:

{conversation_text}

Respond to the customer's latest message.
If you need information about SalesFlow CRM, you may use
the get_product_info tool.
""",

            config=types.GenerateContentConfig(
                tools=[self.product_tool]
            )
        )

        # Check if Gemini requested the product tool
        if response.function_calls:

            function_call = response.function_calls[0]

            if function_call.name == "get_product_info":

                # Execute our Python tool
                product_info = get_product_info()

                # Send the tool result back to Gemini
                response = self.client.models.generate_content(
                    model="gemini-3.6-flash",

                    contents=[
                        f"""
{self.system_prompt}

Customer question:
{user_message}

Here is the product information retrieved from our
internal product database:

{product_info}

Using this information, answer the customer's question.
Do not invent product features.
"""
                    ]
                )

        assistant_response = response.text

        # Save assistant response
        self.memory.add_message(
            "assistant",
            assistant_response
        )

        return assistant_response