import pandas as pd
import logging
from src.config import FEEDBACK_POINTS, SEVERITY_BONUS

logger = logging.getLogger(__name__)

def process_leaderboard(df_reg, df_feed):
    if df_feed.empty:
        logger.warning("Feedback sheet is empty. Returning empty leaderboard.")
        return pd.DataFrame(columns=["Rank", "Display Name", "Phone Number", "Total Reports", "Total Points", "Last Submission Date"])

    # 1. Anti-Duplicate: Drop exact duplicates of Timestamp + Phone Number
    df_feed = df_feed.drop_duplicates(subset=['Timestamp', 'Phone Number'], keep='last')

    # 2. Point Calculation
    # Use .get() to handle unexpected string inputs gracefully, defaulting to 0
    df_feed['Base_Points'] = df_feed['Feedback Type'].map(lambda x: FEEDBACK_POINTS.get(str(x).strip(), 0))
    df_feed['Bonus_Points'] = df_feed['Severity'].map(lambda x: SEVERITY_BONUS.get(str(x).strip(), 0))
    df_feed['Points'] = df_feed['Base_Points'] + df_feed['Bonus_Points']

    # Convert Timestamp to datetime for sorting/aggregation
    df_feed['Timestamp'] = pd.to_datetime(df_feed['Timestamp'])

    # 3. Aggregation Logic
    # Group by Phone Number and calculate totals
    agg_funcs = {
        'Points': ['count', 'sum'],
        'Timestamp': 'max'
    }
    leaderboard = df_feed.groupby('Phone Number').agg(agg_funcs).reset_index()
    
    # Flatten multi-index columns
    leaderboard.columns = ['Phone Number', 'Total Reports', 'Total Points', 'Last Submission Date']

    # 4. Identity Resolution
    if not df_reg.empty:
        # Standardize Phone Number format to strings for merging
        df_reg['Phone Number'] = df_reg['Phone Number'].astype(str).str.strip()
        leaderboard['Phone Number'] = leaderboard['Phone Number'].astype(str).str.strip()
        
        # Extract First Name
        df_reg['First Name'] = df_reg['Full Name'].str.split().str[0]
        
        # Merge registration data (Left join to keep all feedback submitters)
        leaderboard = pd.merge(leaderboard, df_reg[['Phone Number', 'First Name']], on='Phone Number', how='left')
        
        # Resolve Display Name (First Name if exists, else Phone Number)
        leaderboard['Display Name'] = leaderboard['First Name'].fillna(leaderboard['Phone Number'])
    else:
        # Fallback if registration is empty
        leaderboard['Display Name'] = leaderboard['Phone Number']

    # Format Date back to string
    leaderboard['Last Submission Date'] = leaderboard['Last Submission Date'].dt.strftime('%Y-%m-%d %H:%M:%S')

    # 5. Sorting and Ranking
    leaderboard = leaderboard.sort_values(
        by=['Total Points', 'Total Reports', 'Last Submission Date'], 
        ascending=[False, False, False]
    )
    
    # Assign Ranks (1 to N)
    leaderboard.insert(0, 'Rank', range(1, len(leaderboard) + 1))
    
    # Final Output Selection
    final_columns = ["Rank", "Display Name", "Phone Number", "Total Reports", "Total Points", "Last Submission Date"]
    return leaderboard[final_columns]
