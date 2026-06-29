import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
import json
import os
import logging

logger = logging.getLogger(__name__)

def get_gspread_client():
    scopes = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive"
    ]
    
    # Check if running in GitHub Actions (env var) or locally (file)
    creds_json = os.getenv("GCP_CREDENTIALS")
    if creds_json:
        creds_dict = json.loads(creds_json)
        creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scopes)
    else:
        creds = ServiceAccountCredentials.from_json_keyfile_name('credentials.json', scopes)
        
    return gspread.authorize(creds)

def read_sheet_to_df(client, spreadsheet_id, sheet_name="Sheet1"):
    try:
        sheet = client.open_by_key(spreadsheet_id).worksheet(sheet_name)
        records = sheet.get_all_records()
        return pd.DataFrame(records)
    except Exception as e:
        logger.error(f"Error reading sheet {spreadsheet_id}: {e}")
        raise

def write_df_to_sheet(client, spreadsheet_id, df, sheet_name="Sheet1"):
    try:
        sheet = client.open_by_key(spreadsheet_id).worksheet(sheet_name)
        sheet.clear()
        # Convert DataFrame back to list of lists for gspread
        sheet.update([df.columns.values.tolist()] + df.values.tolist())
        logger.info(f"Successfully updated leaderboard in sheet {spreadsheet_id}")
    except Exception as e:
        logger.error(f"Error writing to sheet {spreadsheet_id}: {e}")
        raise
