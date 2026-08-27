import json
from pathlib import Path


def save_lead(
    name,
    company,
    team_size,
    requirement,
    status="qualified"
):

    file_path = (
        Path(__file__).parent.parent.parent
        / "data"
        / "leads.json"
    )

    # Existing leads read करा
    if file_path.exists():

        with open(file_path, "r", encoding="utf-8") as file:
            leads = json.load(file)

    else:
        leads = []

    # New lead
    new_lead = {
        "name": name,
        "company": company,
        "team_size": team_size,
        "requirement": requirement,
        "status": status
    }

    # Add lead
    leads.append(new_lead)

    # Save
    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(
            leads,
            file,
            indent=4
        )

    return new_lead