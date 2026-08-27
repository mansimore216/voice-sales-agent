import json
from pathlib import Path


def get_product_info():

    file_path = (
        Path(__file__).parent.parent
        / "knowledge"
        / "product_info.json"
    )

    with open(file_path, "r", encoding="utf-8") as file:
        product_info = json.load(file)

    return product_info