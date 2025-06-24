import os
import json
import pandas as pd
import torch
import re
import ast
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from pathlib import Path

# Constants
HF_TOKEN = os.getenv("HF_TOKEN", "your_huggingface_token_here")
MODEL_ID = "Pritish92/mistral-7b-custom"

def safe_eval(s):
    """Safely evaluate a string as a Python expression"""
    if not isinstance(s, str):
        return s
    try:
        return ast.literal_eval(s)
    except (SyntaxError, ValueError):
        return s

def load_employee_data(file_path):
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
        print(f"Error loading employee data: {e}")
        return None

def load_model_and_tokenizer():
    """Load the model and tokenizer directly from HuggingFace"""
    print("Loading model...")
    
    # Determine device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    
    compute_dtype = torch.float16
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=compute_dtype,
        bnb_4bit_use_double_quant=True
    )

    # Device mapping strategy based on available hardware
    device_map = "auto" if device == "cuda" else None
    
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        quantization_config=bnb_config if device == "cuda" else None,
        device_map=device_map,
        trust_remote_code=True,
        token=HF_TOKEN,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32
    )
    
    # Move model to device if not using device_map
    if device_map is None:
        model = model.to(device)
    
    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_ID,
        trust_remote_code=True,
        padding_side="left",
        token=HF_TOKEN
    )
    
    tokenizer.pad_token = tokenizer.eos_token
    return model, tokenizer, device

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

def generate_hr_report(model, tokenizer, employee_id, employee_data, chat_history, device):
    """Generate HR report using the Mistral model"""
    processed_chat = extract_conversations_from_qna(chat_history)
    formatted_data = format_employee_data(employee_data)
    
    # Create the prompt for Mistral format
    prompt = f"""<s>[INST]
    You are an AI assistant that analyzes conversations between employees and a chatbot, then creates comprehensive HR reports based on distressed employee data. Your task is to:
    
    1. Analyze conversation tone/content
    2. Identify employee concerns
    3. Extract engagement/satisfaction insights
    4. Assess risks
    5. Recommend actionable steps
    
    CRITICAL INSTRUCTION: NEVER use "N/A" or placeholder text anywhere in your report. If data appears missing, make reasonable inferences based on available information or provide generic but meaningful content.
    
    Create a STRUCTURED report with these REQUIRED sections:
    
    ## 💼 Employee Summary
    - **Employee ID:** {employee_id}
    - **Key Metrics:** [Summarize the most critical metrics like anomaly score, performance rating]
    
    ## 💬 Conversation Analysis
    - **Overall Tone:** [e.g., Appreciative, Stressed, Open, Reserved]
    - **Key Topics Discussed:** [List the main topics from the conversation]
    - **Emerging Concerns:** [Note any new issues or feelings that surfaced]
    
    ## ⚠️ Risk Assessment
    - **Primary Risk Factors:** [List the main drivers of distress based on data]
    - **Severity Level:** [e.g., Low, Medium, High, Critical]
    - **Potential Impact:** [Describe possible effects on performance, retention, or team morale]
    
    ## 💡 Recommended Actions
    - **Immediate Steps:** [Suggest 1-2 urgent actions, if needed]
    - **Short-Term Support:** [e.g., Check-in with manager, offer flexible hours]
    - **Long-Term Strategies:** [e.g., Mentorship program, workload adjustment]
    
    ## 📈 Engagement Insights
    - **Positive Signals:** [Note any positive feedback or signs of improvement]
    - **Areas for Improvement:** [Identify where the employee feels unsupported or unheard]
    
    Based on this data:
    
    **Employee Data:**
    ```json
    {formatted_data}
    ```
    
    **Conversation History:**
    ```
    {processed_chat}
    ```
    
    Now, generate the full HR report based on the provided information.
    [/INST]
    """
    
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    outputs = model.generate(
        **inputs,
        max_new_tokens=1024,
        do_sample=True,
        temperature=0.7,
        top_p=0.9,
        pad_token_id=tokenizer.eos_token_id
    )
    
    report = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Clean up the report to only include the generated content
    report = report.split("[/INST]")[-1].strip()
    return report

def convert_markdown_to_structured_json(markdown_text):
    """Convert the Markdown report to a structured JSON object"""
    data = {}
    
    # Define regex for sections and list items
    section_pattern = r"##\s+.*?(\S+.*?)\s*\n"
    list_item_pattern = r"-\s+\*\*(.*?):\*\*\s*(.*)"
    
    sections = re.split(section_pattern, markdown_text)
    
    # Clean up empty strings and headers
    if sections and sections[0].strip() == "":
        sections.pop(0)
    
    # Process the sections
    for i in range(0, len(sections), 2):
        if i + 1 < len(sections):
            header = sections[i].strip()
            content = sections[i+1].strip()
            
            # Sanitize header to use as key
            key = header.replace("💼", "").replace("💬", "").replace("⚠️", "").replace("💡", "").replace("📈", "").strip().lower().replace(" ", "_")
            
            # Parse list items
            items = {}
            lines = content.split('\n')
            
            for line in lines:
                match = re.match(list_item_pattern, line)
                if match:
                    item_key = match.group(1).strip().lower().replace(" ", "_")
                    item_value = match.group(2).strip()
                    items[item_key] = item_value
            
            # If no list items found, store raw content
            if not items:
                data[key] = content
            else:
                data[key] = items
                
    return json.dumps(data, indent=4)

def generate_hr_summary_from_inputs(employee_id, csv_file_path, chat_history_json):
    """Main function to generate HR summary from given inputs"""
    # Load model and tokenizer
    model, tokenizer, device = load_model_and_tokenizer()
    
    # Load employee data
    employee_df = load_employee_data(csv_file_path)
    if employee_df is None:
        print("Failed to load employee data. Exiting.")
        return
        
    employee_data_row = employee_df[employee_df['Employee_ID'] == employee_id]
    if employee_data_row.empty:
        print(f"No data found for employee {employee_id}. Exiting.")
        return
    
    employee_data = employee_data_row.iloc[0].to_dict()
    
    # Load chat history
    try:
        chat_history = json.loads(chat_history_json)
    except json.JSONDecodeError:
        print("Invalid chat history JSON. Exiting.")
        return
        
    # Generate the report
    hr_report_md = generate_hr_report(model, tokenizer, employee_id, employee_data, chat_history, device)
    
    # Convert to structured JSON
    hr_report_json = convert_markdown_to_structured_json(hr_report_md)
    
    # Save the report
    output_dir = "hr_reports_json"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"hr_report_{employee_id}.json")
    
    with open(output_path, 'w') as f:
        f.write(hr_report_json)
    
    print(f"Successfully generated HR report for {employee_id} at {output_path}")
    
    return hr_report_json

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate HR summary report from employee data and chat history")
    parser.add_argument("--employee_id", type=str, required=True, help="Employee ID to generate report for")
    parser.add_argument("--csv_file", type=str, required=True, help="Path to the CSV file with employee data")
    parser.add_argument("--chat_history_file", type=str, required=True, help="Path to the JSON file with chat history")
    
    args = parser.parse_args()
    
    # Read chat history from file
    with open(args.chat_history_file, 'r') as f:
        chat_history_json_str = f.read()
        
    # Generate the report
    generate_hr_summary_from_inputs(
        employee_id=args.employee_id,
        csv_file_path=args.csv_file,
        chat_history_json=chat_history_json_str
    ) 