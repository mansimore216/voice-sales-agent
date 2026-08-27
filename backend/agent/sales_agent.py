from .prompt import SALES_AGENT_PROMPT


class SalesAgent:

    def __init__(self):
        self.system_prompt = SALES_AGENT_PROMPT

    def get_prompt(self):
        return self.system_prompt