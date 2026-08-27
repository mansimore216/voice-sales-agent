import os
import json

from dotenv import load_dotenv
from google import genai
from google.genai import types

from .prompt import SALES_AGENT_PROMPT
from memory.session_memory import SessionMemory
from tools.product_tool import get_product_info
from tools.pricing_tool import get_pricing_info


load_dotenv()


class SalesAgent:

    def __init__(self):

        self.system_prompt = SALES_AGENT_PROMPT

        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in .env")

        self.client = genai.Client(api_key=api_key)

        self.memory = SessionMemory()

        # -------------------------
        # PRODUCT TOOL
        # -------------------------

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

        # -------------------------
        # PRICING TOOL
        # -------------------------

        self.pricing_tool = types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="get_pricing_info",
                    description=(
                        "Get pricing information for SalesFlow CRM, "
                        "including available plans, monthly prices, "
                        "target customers, and plan features."
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

        # -------------------------
        # SAVE USER MESSAGE
        # -------------------------

        self.memory.add_message(
            "user",
            user_message
        )

        # -------------------------
        # GET MEMORY
        # -------------------------

        conversation = self.memory.get_messages()

        conversation_text = ""

        for message in conversation:
            conversation_text += (
                f"{message['role']}: "
                f"{message['content']}\n"
            )

        # -------------------------
        # FIRST GEMINI CALL
        # -------------------------

        response = self.client.models.generate_content(
            model="gemini-3.6-flash",

            contents=f"""
{self.system_prompt}

Conversation so far:

{conversation_text}

Customer's latest message:

{user_message}

You are a sales agent for SalesFlow CRM.

If the customer asks about product features,
use the get_product_info tool.

If the customer asks about pricing,
use the get_pricing_info tool.

Otherwise, answer naturally.
""",

            config=types.GenerateContentConfig(
                tools=[
                    self.product_tool,
                    self.pricing_tool
                ]
            )
        )

        # -------------------------
        # DEBUG
        # -------------------------

        print("GEMINI RESPONSE:", response)

        # -------------------------
        # CHECK TOOL CALL
        # -------------------------

        if response.function_calls:

            function_call = response.function_calls[0]

            print("TOOL REQUESTED:", function_call.name)

            # -------------------------
            # PRODUCT TOOL
            # -------------------------

            if function_call.name == "get_product_info":

                product_info = get_product_info()

                print("PRODUCT TOOL RESULT:", product_info)

                response = self.client.models.generate_content(
                    model="gemini-3.6-flash",

                    contents=f"""
{self.system_prompt}

Customer asked:

{user_message}

Product information from our database:

{json.dumps(product_info, indent=2)}

Answer the customer using ONLY the information above.

Do not invent product features.
""",
                )

            # -------------------------
            # PRICING TOOL
            # -------------------------

            elif function_call.name == "get_pricing_info":

                pricing_info = get_pricing_info()

                print("PRICING TOOL RESULT:", pricing_info)

                response = self.client.models.generate_content(
                    model="gemini-3.6-flash",

                    contents=f"""
{self.system_prompt}

Customer asked:

{user_message}

Pricing information from our database:

{json.dumps(pricing_info, indent=2)}

Answer the customer using ONLY the pricing information above.

Do not invent prices or plans.
""",
                )

        # -------------------------
        # FINAL RESPONSE
        # -------------------------

        assistant_response = response.text

        print("FINAL RESPONSE:", assistant_response)

        # -------------------------
        # SAVE ASSISTANT RESPONSE
        # -------------------------

        self.memory.add_message(
            "assistant",
            assistant_response
        )

        return assistant_response