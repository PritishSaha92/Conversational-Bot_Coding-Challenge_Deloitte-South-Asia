import os
import json
import pandas as pd
import re
import ast
import logging
from pathlib import Path
from openai import AsyncOpenAI

# Import the shared utility instead of implementing locally
from .mistral_utils import get_mistral_client

# Set up logging
logger = logging.getLogger(__name__)

def safe_eval(s):
    """Safely evaluate a string as a Python expression"""
    if not isinstance(s, str):
        return s
    try:
        return ast.literal_eval(s)
    except (SyntaxError, ValueError):
        return s

def load_employee_data_from_csv(file_path="anomaly_summary.csv"):
    """Load and process employee data from CSV"""
    try:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found at {file_path}")
        
        df = pd.read_csv(file_path)
        
        # Convert string representations of lists to actual lists
        for col in ['Problems', 'Other Problems']:
            if col in df.columns:
                df[col] = df[col].apply(lambda x: safe_eval(x) if isinstance(x, str) else x)
        
        return df
    except Exception as e:
        logger.error(f"Error loading employee data: {e}")
        return None

def extract_conversations_from_qna(chat_history):
    """Extract and format conversations from chat history"""
    if not chat_history:
        return "No chat history available"
        
    if isinstance(chat_history, str):
        # Check if it's a file path
        if os.path.exists(chat_history):
            try:
                with open(chat_history, 'r') as f:
                    chat_history = json.load(f)
            except json.JSONDecodeError:
                with open(chat_history, 'r') as f:
                    return f.read()
        else:
            # Try to parse as JSON string
            try:
                chat_history = json.loads(chat_history)
            except json.JSONDecodeError:
                return chat_history

    # Process based on structure
    formatted_chat = ""
    if isinstance(chat_history, list):
        for entry in chat_history:
            if isinstance(entry, dict):
                # Handle the specific format with direction and message
                if 'direction' in entry and 'message' in entry:
                    direction = entry.get('direction', '')
                    message = entry.get('message', '')
                    if direction == 'sent':
                        formatted_chat += f"User: {message}\n\n"
                    elif direction == 'received':
                        formatted_chat += f"Bot: {message}\n\n"
                # Handle standard chat format with role and content
                elif 'role' in entry and 'content' in entry:
                    role = entry.get('role', '')
                    content = entry.get('content', '')
                    formatted_chat += f"{role.capitalize()}: {content}\n\n"
                # Handle QnA format
                elif 'question' in entry and 'answer' in entry:
                    question = entry.get('question', '')
                    answer = entry.get('answer', '')
                    formatted_chat += f"User: {question}\nBot: {answer}\n\n"
                # Handle other formats
                elif any(key in entry for key in ['user', 'bot', 'assistant', 'system']):
                    for key, value in entry.items():
                        if isinstance(value, str) and value.strip():
                            formatted_chat += f"{key.capitalize()}: {value}\n\n"
            elif isinstance(entry, str):
                formatted_chat += f"{entry}\n\n"
    elif isinstance(chat_history, dict):
        # Handle different dictionary formats
        if 'messages' in chat_history:
            return extract_conversations_from_qna(chat_history['messages'])
        elif 'history' in chat_history:
            return extract_conversations_from_qna(chat_history['history'])
        else:
            for key, value in chat_history.items():
                if isinstance(value, str) and value.strip():
                    formatted_chat += f"{key.capitalize()}: {value}\n\n"
    else:
        formatted_chat = str(chat_history)
    
    return formatted_chat.strip()

def format_employee_data(employee_data):
    """Format employee data for the prompt"""
    formatted_data = {}
    
    # Basic info
    formatted_data["Employee ID"] = employee_data.get("Employee_ID", "")
    formatted_data["Average Work Hours"] = employee_data.get("Average Work Hours", "")
    formatted_data["Performance Rating"] = employee_data.get("Performance Rating", "")
    formatted_data["Reward Factor"] = employee_data.get("Reward Factor", "")
    formatted_data["Vibe Factor"] = employee_data.get("Vibe Factor", "")
    formatted_data["Anomaly Score"] = employee_data.get("Anamaly_Score", "")
    
    # Problems
    formatted_data["Problems"] = []
    problems = employee_data.get("Problems", [])
    if problems and isinstance(problems, list):
        for problem in problems:
            if isinstance(problem, list) and len(problem) >= 2:
                formatted_data["Problems"].append({
                    "issue": problem[0],
                    "score": problem[1]
                })
    
    # Other Problems
    formatted_data["Other Problems"] = []
    other_problems = employee_data.get("Other Problems", [])
    if other_problems and isinstance(other_problems, list):
        for problem in other_problems:
            if isinstance(problem, list) and len(problem) >= 2:
                formatted_data["Other Problems"].append({
                    "issue": problem[0],
                    "score": problem[1]
                })
    
    return json.dumps(formatted_data, indent=2)

async def generate_hr_report(employee_id, employee_data, chat_history):
    """Generate HR report using the Mistral API client"""
    processed_chat = extract_conversations_from_qna(chat_history)
    formatted_data = format_employee_data(employee_data)
    
    # Create the prompt for Mistral format
    prompt = f"""You are an AI assistant that analyzes conversations between employees and a chatbot, then creates comprehensive HR reports based on distressed employee data. Your task is to:
    
    1. Analyze conversation tone/content
    2. Identify employee concerns
    3. Extract engagement/satisfaction insights
    4. Assess risks
    5. Recommend actionable steps
    
    CRITICAL INSTRUCTION: NEVER use "N/A" or placeholder text anywhere in your report. If data appears missing, make reasonable inferences based on available information or provide generic but meaningful content.
    
    Create a STRUCTURED report with these REQUIRED sections:
    
    ## 💼 Employee Summary
    • Basic Info:
      - Employee ID: {employee_id}
      - Problem indicators (from Problems and Other Problems columns)
      - Work hours and performance metrics
    • Quantitative Metrics:
      - Anomaly Score interpretation
      - Vibe Factor analysis
      - Reward Factor evaluation
      - Performance Rating context
      - Average Work Hours assessment
    • Qualitative Analysis:
      - Top issues identified in Problems column
      - Secondary issues from Other Problems column
      - Risk patterns and correlations
    
    ## 🔍 Key Insights
    • Technical Observations:
      - Analyze highest-scoring problem factors 
      - Identify patterns across problem indicators
    • Quantitative Analysis:
      - Compare metrics to normal ranges
      - Analyze correlation between Problems and numeric indicators
    
    ## 🚨 Risk Assessment
    • Concerns:
      - Low-level concerns (scores 0.1-0.3)
      - Medium-level concerns (scores 0.3-0.6)
      - High-level concerns (scores >0.6)
    • Anomalies:
      - Interpret Anomaly Score relative to company average
      - Analyze unusual patterns in Problems and Other Problems
    • Indicators:
      - Connect conversation content with identified problem areas
      - Highlight behavioral indicators from chat history
    
    ## 📈 Recommended Actions
    • Critical Steps:
      - 3-5 highest priority actions targeting top problem areas
      - Specific responsibility assignments (HR/manager/employee)
      - Clear timelines for implementation
    • Additional Considerations:
      - Follow-up procedures based on Anomaly Score
      - Support resources for identified Problems
      - Preventive measures for potential issues
    
    FORMATTING RULES:
    ✅ Use EXACT section headers with emojis as shown above
    ✅ Bold subsection headers using ** **
    ✅ Each bullet point must contain 15+ meaningful words
    ✅ Use • for main points and + for subpoints
    ✅ Include ALL data points from employee information
    
    CRITICAL REQUIREMENTS:
    ✅ NO PLACEHOLDERS - never use "N/A," "TBD," or similar text
    ✅ Balanced section lengths
    ✅ Complete action items addressing ALL risks
    ✅ Specific timelines and responsibility assignments
    
    If you're running out of space, be more concise in earlier sections but NEVER use placeholder text or leave sections incomplete.
    
    Employee: {employee_id}
    Data: {formatted_data}
    Conversation: {processed_chat}
    
    Generate a COMPLETE HR report with NO placeholder text like "N/A". Every section must contain meaningful content based on the distressed employees dataset structure and chat history."""
    
    # Get the Mistral client
    mistral_client = await get_mistral_client()
    
    # Generate the report using the client
    completion = await mistral_client.chat.completions.create(
        model="unsloth/mistral-7b-instruct-v0.2",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0,
        max_completion_tokens=4096,
        top_p=0.9,
        frequency_penalty=1.15
    )
    
    # Extract the response
    response = completion.choices[0].message.content
    
    return response

def convert_markdown_to_structured_json(markdown_text):
    """Convert markdown HR report to structured JSON using line-by-line parsing"""
    # Initialize the structure
    report = {
        "Employee Summary": {
            "Basic Info": [],
            "Quantitative Metrics": [],
            "Qualitative Analysis": []
        },
        "Key Insights": {
            "Technical Observations": [],
            "Quantitative Analysis": []
        },
        "Risk Assessment": {
            "Concerns": [],
            "Anomalies": [],
            "Indicators": []
        },
        "Recommended Actions": {
            "Critical Steps": [],
            "Additional Considerations": []
        }
    }
    
    # Clean the markdown text by removing indentation
    cleaned_lines = [line.lstrip() for line in markdown_text.split('\n')]
    
    current_section = None
    current_subsection = None
    
    for line in cleaned_lines:
        if not line:
            continue
            
        # Check for main section headers
        if line.startswith('## '):
            section_title = line[3:].strip()
            clean_title = re.sub(r'[^\w\s]', '', section_title).strip()
            
            for key in report.keys():
                if clean_title.lower() in key.lower() or key.lower() in clean_title.lower():
                    current_section = key
                    current_subsection = None
                    break
                
        # Check for subsection headers - both markdown ### style and bold ** ** style
        elif line.startswith('### ') or (line.startswith('**') and '**' in line[2:]):
            if not current_section:
                continue
                
            # Extract subsection title
            if line.startswith('### '):
                subsection_title = line[4:].strip()
            else:
                subsection_title = line.replace('**', '').strip()
                
            if subsection_title.endswith(':'):
                subsection_title = subsection_title[:-1]
                
            # Find matching subsection
            for key in report[current_section].keys():
                if subsection_title.lower() in key.lower() or key.lower() in subsection_title.lower():
                    current_subsection = key
                    break
        
        # Check for bullet points (handles different styles)
        elif (line.startswith('-') or line.startswith('•') or line.startswith('+') or 
              line.startswith('1.') or line.startswith('2.') or line.startswith('3.') or 
              line.startswith('4.') or line.startswith('5.')):
            
            if not current_section or not current_subsection:
                continue
                
            # Extract bullet text (everything after the bullet marker)
            marker_end = line.find(' ')
            if marker_end != -1:
                bullet_text = line[marker_end+1:].strip()
                if bullet_text and bullet_text != "**":
                    # Handle cases where there might be bold formatting
                    if bullet_text.startswith('**') and '**:' in bullet_text:
                        # Skip subsection headers in bullet format
                        continue
                    report[current_section][current_subsection].append(bullet_text)
    
    # Remove empty arrays from the report
    for section, subsections in list(report.items()):
        for subsection in list(subsections.keys()):
            if not subsections[subsection]:
                del report[section][subsection]
        if not report[section]:
            del report[section]
    
    return report

async def generate_hr_summary_from_inputs(employee_id, csv_file_path=None, chat_history_json=None):
    """Generate HR report from CSV file and chat history JSON string"""
    logger.info(f"Generating HR summary for employee {employee_id}")
    
    # Load employee data
    if csv_file_path is None:
        csv_file_path = "anomaly_summary.csv"
    
    df = load_employee_data_from_csv(csv_file_path)
    
    if df is None:
        return json.dumps({"error": "Failed to load employee data"})
    
    # Filter data for the specified employee
    employee_rows = df[df['Employee_ID'] == employee_id]
    
    if len(employee_rows) == 0:
        return json.dumps({"error": f"Employee ID {employee_id} not found in the dataset"})
    
    employee_data = employee_rows.iloc[0].to_dict()
    
    # Generate report
    markdown_report = await generate_hr_report(employee_id, employee_data, chat_history_json)
    
    # Convert markdown to structured JSON
    structured_report = convert_markdown_to_structured_json(markdown_report)
    
    # Prepare final report
    final_report = {
        "employee_id": employee_id,
        "report_date": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
        "report": structured_report,
        "raw_markdown": markdown_report
    }
    
    # Return JSON string
    return json.dumps(final_report, indent=2)

# Command line interface
if __name__ == "__main__":
    import argparse
    import asyncio
    
    parser = argparse.ArgumentParser(description='Generate HR summary reports')
    parser.add_argument('--employee_id', type=str, required=True, help='Employee ID')
    parser.add_argument('--csv_file', type=str, default="anomaly_summary.csv", help='Path to distressed employees CSV file')
    parser.add_argument('--chat_history', type=str, help='Chat history as JSON string or path to JSON file')
    parser.add_argument('--output_file', type=str, help='Output file path (optional)')
    
    args = parser.parse_args()
    
    # Generate report using asyncio
    async def main():
        result_json = await generate_hr_summary_from_inputs(args.employee_id, args.csv_file, args.chat_history)
        
        # Save to file if specified, otherwise print to console
        if args.output_file:
            with open(args.output_file, 'w') as f:
                f.write(result_json)
            print(f"Report saved to {args.output_file}")
        else:
            print(result_json)
    
    # Run the async function
    asyncio.run(main())