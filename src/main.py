import logging
from src.config import REGISTRATION_SHEET_ID, FEEDBACK_SHEET_ID, LEADERBOARD_SHEET_ID
from src.google_sheets import get_gspread_client, read_sheet_to_df, write_df_to_sheet
from src.processor import process_leaderboard

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

def main():
    logger.info("Starting C-Transit Leaderboard Sync...")
    
    try:
        client = get_gspread_client()
        
        logger.info("Fetching Registration Sheet...")
        df_reg = read_sheet_to_df(client, REGISTRATION_SHEET_ID)
        
        logger.info("Fetching Feedback Sheet...")
        df_feed = read_sheet_to_df(client, FEEDBACK_SHEET_ID)
        
        logger.info("Processing Data...")
        df_leaderboard = process_leaderboard(df_reg, df_feed)
        
        logger.info("Uploading Leaderboard to Google Sheets...")
        write_df_to_sheet(client, LEADERBOARD_SHEET_ID, df_leaderboard)
        
        logger.info("Sync Complete.")
        
    except Exception as e:
        logger.error(f"Sync failed: {e}")
        raise

if __name__ == "__main__":
    main()
