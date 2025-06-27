import pandas as pd
import numpy as np

def merge_files(activity_file, leave_file, onboarding_file, performance_file, rewards_file, vibemeter_file, output_file):
    """
    Reads in multiple CSV files corresponding to different HR metrics,
    processes and aggregates the data, merges the summaries, and
    saves the output master dataframe to the specified CSV file.

    Parameters:
    - activity_file: path to activity tracker CSV
    - leave_file: path to leave CSV
    - onboarding_file: path to onboarding CSV
    - performance_file: path to performance CSV
    - rewards_file: path to rewards CSV
    - vibemeter_file: path to vibemeter CSV
    - output_file: path to save the master_df.csv
    """
    # Set decay constant
    lambda_decay = 0.01

    # ---------------------------
    # Process Activity DataFrame
    # ---------------------------
    activity_df = pd.read_csv(activity_file, parse_dates=['Date'])
    activity_df.columns = activity_df.columns.str.strip()

    activity_summary = activity_df.groupby('Employee_ID').agg({
        'Teams_Messages_Sent': ['sum', 'mean', 'median', 'std'],
        'Emails_Sent': ['sum', 'mean', 'median', 'std'],
        'Meetings_Attended': ['sum', 'mean', 'median', 'std'],
        'Work_Hours': ['sum', 'mean', 'median', 'std'],
        'Date': ['max', 'count']
    }).reset_index()

    # Fill missing standard deviation values with 0
    std_columns = [col for col in activity_summary.columns if col[1].endswith('std')]
    activity_summary[std_columns] = activity_summary[std_columns].fillna(0)

    # Flatten MultiIndex columns if needed
    def flatten_columns(df):
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = ['_'.join(map(str, col)).strip('_') for col in df.columns.values]
        return df

    activity_summary = flatten_columns(activity_summary)
    activity_summary.rename(columns={'Date_max': 'Last_activity_entry', 'Date_count': 'Total_activity_entry'}, inplace=True)

    # ------------------------
    # Process Leave DataFrame
    # ------------------------
    leave_df = pd.read_csv(leave_file, parse_dates=['Leave_Start_Date', 'Leave_End_Date'])
    leave_df.columns = leave_df.columns.str.strip()

    # Use the maximum Leave_End_Date as the reference date
    reference_date = leave_df.Leave_End_Date.max()
    leave_df['Delta_Days'] = (reference_date - leave_df['Leave_End_Date']).dt.days
    leave_df['Leave_Factor'] = leave_df['Leave_Days'] * np.exp(-lambda_decay * leave_df['Delta_Days'])
    
    leave_factor = leave_df.groupby(['Employee_ID', 'Leave_Type'])['Leave_Factor'].sum().reset_index()
    leave_factor_pivot = leave_factor.pivot(index='Employee_ID', columns='Leave_Type', values='Leave_Factor').reset_index()
    leave_factor_pivot = leave_factor_pivot.fillna(0)
    leave_summary = leave_factor_pivot.rename(columns=lambda x: x + '_Factor' if x != 'Employee_ID' else x)

    # ---------------------------
    # Process Onboarding DataFrame
    # ---------------------------
    onboarding_df = pd.read_csv(onboarding_file, parse_dates=['Joining_Date'])
    onboarding_df.columns = onboarding_df.columns.str.strip()
    onboarding_df['Onboarding_Feedback'] = onboarding_df['Onboarding_Feedback'].astype(str).str.strip()
    onboarding_df['Mentor_Assigned'] = onboarding_df['Mentor_Assigned'].astype(str).str.strip().map({'True': True, 'False': False})
    onboarding_df['Initial_Training_Completed'] = onboarding_df['Initial_Training_Completed'].astype(str).str.strip().map({'True': True, 'False': False})

    onboarding_summary = onboarding_df.groupby('Employee_ID', as_index=False).agg({
        'Joining_Date': 'first',
        'Onboarding_Feedback': 'last',
        'Mentor_Assigned': 'last',
        'Initial_Training_Completed': 'last'
    })

    feedback_mapping = {
        'Excellent': 3,
        'Poor': 0,
        'Average': 1,
        'Good': 2
    }
    onboarding_summary['Feedback_Score'] = onboarding_summary['Onboarding_Feedback'].map(feedback_mapping)
    reference_date = onboarding_summary.Joining_Date.max()
    onboarding_summary['Days_Since_Joining'] = (reference_date - onboarding_summary['Joining_Date']).dt.days

    onboarding_summary['Decay_Factor'] = np.exp(-lambda_decay * onboarding_summary['Days_Since_Joining'])
    onboarding_summary['Onboarding_Factor'] = onboarding_summary['Feedback_Score'] * onboarding_summary['Decay_Factor']
    onboarding_summary.drop(['Decay_Factor', 'Feedback_Score'], axis=1, inplace=True)

    # ----------------------------
    # Process Performance DataFrame
    # ----------------------------
    perf_df = pd.read_csv(performance_file)
    perf_df.columns = perf_df.columns.str.strip()
    perf_df['Review_Period'] = perf_df['Review_Period'].astype(str).str.strip()
    perf_df['Manager_Feedback'] = perf_df['Manager_Feedback'].astype(str).str.strip()
    perf_df['Performance_Rating'] = pd.to_numeric(perf_df['Performance_Rating'], errors='coerce')
    perf_df['Promotion_Consideration'] = perf_df['Promotion_Consideration'].astype(str).str.strip().map({
        'TRUE': True, 'FALSE': False, 'True': True, 'False': False
    })
    # Split review period into Period and Year
    perf_df[['Period', 'Year']] = perf_df['Review_Period'].str.split(' ', expand=True)
    perf_df['Year'] = pd.to_numeric(perf_df['Year'], errors='coerce')
    period_mapping = {'H1': 1, 'H2': 2, 'Annual': 3}
    perf_df['Period_Order'] = perf_df['Period'].map(period_mapping)
    perf_df_sorted = perf_df.sort_values(['Employee_ID', 'Year', 'Period_Order'], ascending=[True, False, False])
    perf_summary = perf_df_sorted.groupby('Employee_ID', as_index=False).first()
    perf_summary = perf_summary.drop(columns=['Review_Period', 'Period_Order'])
    perf_summary = perf_summary.rename(columns={'Period': 'Last_Review_Period', 'Year': 'Last_Review_Year'})

    # ------------------------
    # Process Rewards DataFrame
    # ------------------------
    rewards_df = pd.read_csv(rewards_file, parse_dates=['Award_Date'])
    rewards_df.columns = rewards_df.columns.str.strip()
    rewards_df['Award_Type'] = rewards_df['Award_Type'].astype(str).str.strip()
    rewards_df['Reward_Points'] = pd.to_numeric(rewards_df['Reward_Points'], errors='coerce')
    reference_date = rewards_df.Award_Date.max()
    rewards_df['Days_Since_Award'] = (reference_date - rewards_df['Award_Date']).dt.days
    rewards_df['Decayed_Reward_Points'] = rewards_df['Reward_Points'] * np.exp(-lambda_decay * rewards_df['Days_Since_Award'])

    reward_counts = rewards_df.groupby(['Employee_ID', 'Award_Type']).size().reset_index(name='Reward_Count')
    reward_counts_pivot = reward_counts.pivot(index='Employee_ID', columns='Award_Type', values='Reward_Count').reset_index()
    reward_counts_pivot = reward_counts_pivot.fillna(0)
    reward_counts_pivot.columns = ['Employee_ID'] + [f"{col}_Count" for col in reward_counts_pivot.columns if col != 'Employee_ID']

    decayed_points_total = rewards_df.groupby('Employee_ID')['Decayed_Reward_Points'].sum().reset_index()
    decayed_points_total = decayed_points_total.rename(columns={'Decayed_Reward_Points': 'Total_Decayed_Reward_Points'})
    rewards_summary = pd.merge(reward_counts_pivot, decayed_points_total, on='Employee_ID', how='outer')

    # -------------------------
    # Process Vibemeter DataFrame
    # -------------------------
    vibe_df = pd.read_csv(vibemeter_file, parse_dates=['Response_Date'])
    vibe_df.columns = vibe_df.columns.str.strip()
    vibe_df['Emotion_Zone'] = vibe_df['Emotion_Zone'].astype(str).str.strip()

    emotion_mapping = {
        'Frustrated Zone': -3,
        'Sad Zone': -2,
        'Leaning to Sad Zone': -1,
        'Neutral Zone (OK)': 0,
        'Leaning to Happy Zone': 1,
        'Happy Zone': 2,
        'Excited Zone': 3
    }
    vibe_df['Emotion_Value'] = vibe_df['Emotion_Zone'].map(emotion_mapping)
    reference_date = vibe_df.Response_Date.max()
    vibe_df['Days_Since_Response'] = (reference_date - vibe_df['Response_Date']).dt.days

    lambda_decay1, lambda_decay2 = 0.005, 0.005
    vibe_df['Decayed_Emotion_Zone'] = vibe_df['Emotion_Value'] * np.exp(-lambda_decay1 * vibe_df['Days_Since_Response'])
    vibe_df['Decayed_Vibe'] = vibe_df['Vibe_Score'] * np.exp(-lambda_decay2 * vibe_df['Days_Since_Response'])
    
    vibe_summary = vibe_df.groupby('Employee_ID').agg({
        'Decayed_Emotion_Zone': 'sum',
        'Decayed_Vibe': 'sum'
    }).reset_index()

    # --------------------------
    # Merge All Summaries
    # --------------------------
    master_df = activity_summary.merge(leave_summary, on='Employee_ID', how='outer') \
                                .merge(onboarding_summary, on='Employee_ID', how='outer') \
                                .merge(perf_summary, on='Employee_ID', how='outer') \
                                .merge(rewards_summary, on='Employee_ID', how='outer') \
                                .merge(vibe_summary, on='Employee_ID', how='outer')
    # Drop unwanted column if needed (as per original script)
    if 'Decayed_Emotion_Zone' in master_df.columns:
        master_df.drop(columns=['Decayed_Emotion_Zone'], axis=1, inplace=True)

    # Save the master DataFrame to CSV
    master_df.to_csv(output_file, index=False)
    print(f"Master dataframe saved to: {output_file}")

# Example usage:
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Merge HR datasets into a master CSV file.")
    parser.add_argument("--activity", required=True, help="Path to activity dataset CSV")
    parser.add_argument("--leave", required=True, help="Path to leave dataset CSV")
    parser.add_argument("--onboarding", required=True, help="Path to onboarding dataset CSV")
    parser.add_argument("--performance", required=True, help="Path to performance dataset CSV")
    parser.add_argument("--rewards", required=True, help="Path to rewards dataset CSV")
    parser.add_argument("--vibemeter", required=True, help="Path to vibemeter dataset CSV")
    parser.add_argument("--output", required=True, help="Path to save the output master CSV file")

    args = parser.parse_args()

    merge_files(args.activity, args.leave, args.onboarding, args.performance, args.rewards, args.vibemeter, args.output)
