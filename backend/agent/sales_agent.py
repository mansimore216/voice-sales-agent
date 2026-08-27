import os
import json

from dotenv import load_dotenv
from google import genai
from google.genai import types

from .prompt import SALES_AGENT_PROMPT
from memory.session_memory import SessionMemory

from tools.product_tool import get_product_info
from tools.pricing_tool import get_pricing_info
from tools.lead_tool import save_lead
from tools.calendar_tool import book_meeting


load_dotenv()


class SalesAgent:

    def __init__(self):

        self.system_prompt = SALES_AGENT_PROMPT

        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in .env")

        self.client = genai.Client(api_key=api_key)

        self.memory = SessionMemory()

        # =====================================================
        # PRODUCT TOOL
        # =====================================================

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

        # =====================================================
        # PRICING TOOL
        # =====================================================

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

        # =====================================================
        # LEAD TOOL
        # =====================================================

        self.lead_tool = types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="save_lead",
                    description=(
                        "Save a qualified SalesFlow CRM lead. "
                        "Use this when the customer has shown clear "
                        "interest in the product and enough lead "
                        "information has been collected."
                    ),
                    parameters=types.Schema(
                        type="OBJECT",
                        properties={
                            "name": types.Schema(
                                type="STRING",
                                description="Customer's name"
                            ),
                            "company": types.Schema(
                                type="STRING",
                                description="Customer's company name"
                            ),
                            "team_size": types.Schema(
                                type="INTEGER",
                                description="Number of salespeople"
                            ),
                            "requirement": types.Schema(
                                type="STRING",
                                description="Customer's CRM requirement"
                            )
                        },
                        required=[
                            "name",
                            "company",
                            "team_size",
                            "requirement"
                        ]
                    )
                )
            ]
        )

        # =====================================================
        # CALENDAR TOOL
        # =====================================================

        self.calendar_tool = types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="book_meeting",
                    description=(
                        "Book a sales meeting for a qualified customer. "
                        "Use this when the customer explicitly wants "
                        "to schedule a meeting with the sales team."
                    ),
                    parameters=types.Schema(
                        type="OBJECT",
                        properties={
                            "name": types.Schema(
                                type="STRING",
                                description="Customer's name"
                            ),
                            "date": types.Schema(
                                type="STRING",
                                description="Requested meeting date"
                            ),
                            "time": types.Schema(
                                type="STRING",
                                description="Requested meeting time"
                            )
                        },
                        required=[
                            "name",
                            "date",
                            "time"
                        ]
                    )
                )
            ]
        )

    # =========================================================
    # GET PROMPT
    # =========================================================

    def get_prompt(self):
        return self.system_prompt

    # =========================================================
    # CHAT
    # =========================================================

    def chat(self, user_message):

        # -----------------------------------------------------
        # SAVE USER MESSAGE
        # -----------------------------------------------------

        self.memory.add_message(
            "user",
            user_message
        )

        # -----------------------------------------------------
        # GET MEMORY
        # -----------------------------------------------------

        conversation = self.memory.get_messages()

        conversation_text = ""

        for message in conversation:
            conversation_text += (
                f"{message['role']}: "
                f"{message['content']}\n"
            )

        # -----------------------------------------------------
        # FIRST GEMINI CALL
        # -----------------------------------------------------

        response = self.client.models.generate_content(

            model="gemini-3.6-flash",

            contents=f"""
{self.system_prompt}

Conversation so far:

{conversation_text}

Customer's latest message:

{user_message}

You are a sales agent for SalesFlow CRM.

Rules:

1. If the customer asks about product features,
   use the get_product_info tool.

2. If the customer asks about pricing,
   use the get_pricing_info tool.

3. If the customer is clearly interested in buying
   and enough information has been collected,
   use the save_lead tool.

4. If the customer explicitly wants to schedule
   a meeting, use the book_meeting tool.

5. Otherwise, answer naturally.
""",

            config=types.GenerateContentConfig(
                tools=[
                    self.product_tool,
                    self.pricing_tool,
                    self.lead_tool,
                    self.calendar_tool
                ]
            )
        )

        # -----------------------------------------------------
        # DEBUG
        # -----------------------------------------------------

        print("GEMINI RESPONSE:", response)

        # -----------------------------------------------------
        # CHECK TOOL CALL
        # -----------------------------------------------------

        if response.function_calls:

            function_call = response.function_calls[0]

            print(
                "TOOL REQUESTED:",
                function_call.name
            )

            # =================================================
            # PRODUCT TOOL
            # =================================================

            if function_call.name == "get_product_info":

                product_info = get_product_info()

                print(
                    "PRODUCT TOOL RESULT:",
                    product_info
                )

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
"""
                )

            # =================================================
            # PRICING TOOL
            # =================================================

            elif function_call.name == "get_pricing_info":

                pricing_info = get_pricing_info()

                print(
                    "PRICING TOOL RESULT:",
                    pricing_info
                )

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
"""
                )

            # =================================================
            # LEAD TOOL
            # =================================================

            elif function_call.name == "save_lead":

                args = function_call.args

                print(
                    "LEAD TOOL ARGUMENTS:",
                    args
                )

                lead = save_lead(
                    name=args["name"],
                    company=args["company"],
                    team_size=args["team_size"],
                    requirement=args["requirement"]
                )

                print(
                    "LEAD SAVED:",
                    lead
                )

                response = self.client.models.generate_content(

                    model="gemini-3.6-flash",

                    contents=f"""
{self.system_prompt}

The customer lead has been successfully saved.

Lead information:

{json.dumps(lead, indent=2)}

Tell the customer that their information has been
successfully recorded and continue the sales conversation.
"""
                )

            # =================================================
            # CALENDAR TOOL
            # =================================================

            elif function_call.name == "book_meeting":

                args = function_call.args

                print(
                    "CALENDAR TOOL ARGUMENTS:",
                    args
                )

                meeting = book_meeting(
                    name=args["name"],
                    date=args["date"],
                    time=args["time"]
                )

                print(
                    "CALENDAR TOOL RESULT:",
                    meeting
                )

                response = self.client.models.generate_content(

                    model="gemini-3.6-flash",

                    contents=f"""
{self.system_prompt}

The customer's meeting has been successfully booked.

Meeting information:

{json.dumps(meeting, indent=2)}

Tell the customer that the meeting has been successfully
scheduled and provide the meeting date and time.
"""
                )

        # -----------------------------------------------------
        # FINAL RESPONSE
        # -----------------------------------------------------

        assistant_response = response.text

        print(
            "FINAL RESPONSE:",
            assistant_response
        )

        # -----------------------------------------------------
        # SAVE ASSISTANT RESPONSE
        # -----------------------------------------------------

        self.memory.add_message(
            "assistant",
            assistant_response
        )

        return assistant_response