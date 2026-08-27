from datetime import datetime


def book_meeting(name, date, time):
    """
    Book a sales meeting for a qualified customer.
    """

    meeting = {
        "name": name,
        "date": date,
        "time": time,
        "status": "confirmed"
    }

    print("Meeting booked:", meeting)

    return meeting