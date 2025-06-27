import asyncio
import json
import os
import time
import pandas as pd
from mistralai import Mistral, UserMessage, Tool

# Create a function to generate the prompt based on employee ID
def generate_prompt(employee_id):
    system_content = """
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
"""

    # Get employee data based on employee_id
    if employee_id == "EMP0040":
        employee_data = """
Employee ID: EMP0040
Key Issues:
- Sick Leave Impact Factor: 0.739 (High)
- Average Daily Teams Messages: 0.640 (High)
- Median Daily Teams Messages: 0.606 (High)
- Average Meetings Attended per Day: 0.499 (High)
- Median Meetings Attended per Day: 0.439 (High)

Other Notable Factors:
- Onboarding Feedback: Poor
- Performance Rating: 3.0
- Manager Feedback: Needs Improvement
- Average Work Hours: 8.42 hours per day
- Reward Points: Low (2.90)
- Vibe Score: High (4.15)
- Tenure: 459 days since joining
- Initial Training Completed: Yes
- Promotion Consideration: Yes

Communication patterns show high activity in messaging but zero meetings attended, suggesting potential isolation or communication challenges. The employee has taken sick leave recently and has a poor onboarding experience despite being with the company for over a year. While their performance rating is average (3.0), manager feedback indicates they need improvement. Their work hours are significant (8.42 hours/day) which may contribute to stress.
"""
    elif employee_id == "EMP0108":
        employee_data = """
Employee ID: EMP0108
Key Issues:
- Decayed Vibe Score: 0.741 (Very High)
- Average Daily Teams Messages: 0.661 (High)
- Median Daily Teams Messages: 0.628 (High)
- Median Meetings Attended per Day: 0.539 (High)
- Average Meetings Attended per Day: 0.522 (High)

Other Notable Factors:
- Onboarding Feedback: Poor
- Performance Rating: 4.0
- Manager Feedback: Needs Improvement
- Average Work Hours: 9.58 hours per day (Very High)
- Reward Points: Low (8.19)
- Annual Leave Impact: 3.70 (Moderate)
- Median Work Hours: 9.58 (High)
- Initial Training Completed: Yes
- Promotion Consideration: Yes

This employee shows very high work hours (9.58/day) combined with high communication volume and meeting attendance. Despite having a high performance rating (4.0), they have received "Needs Improvement" feedback from their manager. They've had poor onboarding experience and show an extremely high vibe score (emotional response), suggesting significant stress. High work hours combined with high meeting attendance may indicate work-life balance issues.
"""
    else:
        employee_data = "No specific data available for this employee."

    full_content = system_content + employee_data
    return [{"role": "system", "content": full_content}]

# Export API key as a constant
API_KEY = 'Z8c1IRM576ryQOUkfjDul7GeShQ37ULN'

# Extract model name as a constant
MODEL_NAME = "mistral-large-latest"

# Create Mistral client function that can be reused
def create_mistral_client():
    return Mistral(api_key=API_KEY)

# Function to process a query through Mistral
async def process_query(query, employee_id=None, conversation_history=None):
    if conversation_history is None:
        conversation_history = generate_prompt(employee_id)
    
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
    # Ask for employee ID
    employee_id = input("Enter Employee ID (e.g., EMP0040, EMP0108): ")
    
    # Generate prompt based on employee ID
    conversation_history = generate_prompt(employee_id)
    
    while True:
        query = input("Enter you query\n")
        response, conversation_history = await process_query(query, employee_id, conversation_history)

# Only run the main function if script is executed directly (not imported)
if __name__ == "__main__":
    asyncio.run(main())
