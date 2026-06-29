import os
from dotenv import load_dotenv

load_dotenv()

# Google Sheets Configuration
REGISTRATION_SHEET_ID = os.getenv("REGISTRATION_SHEET_ID")
FEEDBACK_SHEET_ID = os.getenv("FEEDBACK_SHEET_ID")
LEADERBOARD_SHEET_ID = os.getenv("LEADERBOARD_SHEET_ID")

# Point System Configuration
FEEDBACK_POINTS = {
    "Bug": 5,
    "Suggestion": 3,
    "Feature Request": 2,
    "General Feedback": 1
}

SEVERITY_BONUS = {
    "Minor": 0,
    "Moderate": 1,
    "Major": 3,
    "Critical": 5
}
