import asyncio
import json
import os
import time
from mistralai import Mistral, UserMessage, Tool


# Extract the prompt to be imported elsewhere
prompt = [
    {
        "role": "system",
        "content":
        """
You are an AI-powered HR assistant designed to help employees manage stress by engaging in natural, supportive conversations. Your goal is to determine the root cause of stress by asking appropriate follow-up questions based on the user's responses.

You have access to an API key that allows you to retrieve past employee interactions, workload data, feedback history, and common stress indicators.

Behavioral Flow:

Start with an open-ended question to gauge the employee's current state and generate an appropriate response. End it there.

Analyze their response and the available User Past Data to identify the problems lying underneath.

Determine the most relevant follow-up question based on their the analysis.

Continue adapting questions dynamically until a root cause is identified. Try to limit the conversation so that it may not extend very long.

Offer personalized recommendations or escalate concerns if necessary.

On understanding the problem of the employee and the reason behind it, offer a solution if possible or tell the user that the issue will be escaleted to HR. End the conversation then.

Example API Call Flow:

User Input: "I feel overwhelmed lately."

API Request: Retrieve past workload and feedback history.

AI Decision: If past data shows high workload, ask: "Is your current workload heavier than usual, or are there other factors causing stress?"

User Input: "Too many deadlines."

API Request: Fetch deadline patterns from past data.

AI Decision: If deadlines frequently cause stress, ask: "Would it help if I suggest better task prioritization strategies?"

Ensure each question is empathetic, context-aware, and progressively narrows down the root cause while maintaining a confidential and supportive tone.

User Past Data:-
{'Index': np.int64(8), 'Employee_ID': 'EMP0009', 'Teams_Messages_Sent_sum': np.float64(44.0), 'Teams_Messages_Sent_mean': np.float64(22.0), 'Teams_Messages_Sent_median': np.float64(22.0), 'Teams_Messages_Sent_std': np.float64(31.11269837220809), 'Emails_Sent_sum': np.float64(50.0), 'Emails_Sent_mean': np.float64(25.0), 'Emails_Sent_median': np.float64(25.0), 'Emails_Sent_std': np.float64(1.4142135623730951), 'Meetings_Attended_sum': np.float64(2.0), 'Meetings_Attended_mean': np.float64(1.0), 'Meetings_Attended_median': np.float64(1.0), 'Meetings_Attended_std': np.float64(1.4142135623730951), 'Work_Hours_sum': np.float64(16.28), 'Work_Hours_mean': np.float64(8.14), 'Work_Hours_median': np.float64(8.14), 'Work_Hours_std': np.float64(1.3010764773832482), 'Last_activity_entry': '2024-02-25', 'Total_activity_entry': np.float64(2.0), 'Annual_Leave_Factor': np.float64(0.0), 'Casual_Leave_Factor': np.float64(9.01650989516398), 'Sick_Leave_Factor': np.float64(0.0), 'Unpaid_Leave_Factor': np.float64(0.0), 'Joining_Date': '2023-08-31', 'Onboarding_Feedback': 'Average', 'Mentor_Assigned': np.True_, 'Initial_Training_Completed': np.False_, 'Days_Since_Joining': np.float64(257.0), 'Onboarding_Factor': np.float64(0.0765355454239115), 'Performance_Rating': np.float64(1.0), 'Manager_Feedback': 'Meets Expectations', 'Promotion_Consideration': np.True_, 'Last_Review_Period': 'H2', 'Last_Review_Year': np.float64(2023.0), 'Best_Team_Player_Count': np.float64(2.0), 'Innovation_Award_Count': np.float64(0.0), 'Leadership_Excellence_Count': np.float64(1.0), 'Star_Performer_Count': np.float64(1.0), 'Total_Decayed_Reward_Points': np.float64(74.64253822558632), 'Decayed_Emotion_Zone': np.float64(-0.3671984580554357), 'Decayed_Vibe': np.float64(0.7343969161108714)}
"""
    }
]

# Export API key as a constant
API_KEY = 'Z8c1IRM576ryQOUkfjDul7GeShQ37ULN'

# Extract model name as a constant
MODEL_NAME = "mistral-large-latest"

# Create Mistral client function that can be reused
def create_mistral_client():
    return Mistral(api_key=API_KEY)

# Function to process a query through Mistral
async def process_query(query, conversation_history=None):
    if conversation_history is None:
        conversation_history = prompt.copy()
    
    # Add user message to conversation history
    user_prompt = {"role": "user", "content": query}
    conversation_history.append(user_prompt)
    
    # Initialize Mistral client
    client = create_mistral_client()
    
    # Call Mistral API
    response_text = ""
    async_response = await client.chat.stream_async(
        messages=conversation_history,
        model=MODEL_NAME
    )
    
    # Process response chunks
    async for chunk in async_response:
        if chunk.data.choices[0].delta.content:
            chunk_text = chunk.data.choices[0].delta.content
            response_text += chunk_text
            # In CLI mode, print each chunk
            print(chunk_text, end="")
    
    # Add assistant's response to conversation history
    conversation_history.append({
        "role": "assistant",
        "content": response_text
    })
    
    print()  # Add a new line
    return response_text, conversation_history

async def main():
    conversation_history = prompt.copy()
    while True:
        query = input("Enter you query\n")
        response, conversation_history = await process_query(query, conversation_history)

# Only run the main function if script is executed directly (not imported)
if __name__ == "__main__":
    asyncio.run(main())
