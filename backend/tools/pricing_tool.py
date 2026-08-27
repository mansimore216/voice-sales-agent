import json
from pathlib import Path


def get_pricing_info():

    file_path = (
        Path(__file__).parent.parent
        / "knowledge"
        / "pricing.json"
    )

    with open(file_path, "r", encoding="utf-8") as file:
        pricing_info = json.load(file)

    return pricing_info