# csv_processor/utils/mood_tips.py

import requests
from dotenv import load_dotenv
import os

HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1"
load_dotenv()
API_TOKEN = os.getenv("API_TOKEN")

headers = {
    "Authorization": f"Bearer {API_TOKEN}"
}

def get_tips_from_mood(mood_score: int) -> list:
    mood_map = {
        1: "very sad",
        2: "sad",
        3: "neutral",
        4: "positive",
        5: "happy",
        6: "very happy"
    }

    mood = mood_map.get(mood_score, "neutral")
    prompt = f"""
You are an expert in employee wellness. Suggest 2 short tips (2–3 words only) in bullet points to improve an employee’s physical or mental health, based on their current mood score: {mood} (1 = very low mood, 6 = very happy). 

- If mood is between 1–3: give calm, uplifting, simple self-care tips (e.g., "Drink water", "Stretch gently").
- If mood is between 4–6: give energizing or wellness-maintenance tips (e.g., "Go for walk", "Appreciate moment").
- The tips should be non-repetitive across calls. 
- Return just the 2 bullet points.

Example output:
1. Take deep breaths  
2. Talk to someone
"""

    response = requests.post(
        HUGGING_FACE_API_URL + "?wait_for_model=true",
        headers=headers,
        json={"inputs": prompt}
    )

    if response.status_code == 200:
        try:
            generated_text = response.json()[0]['generated_text']

            # Split the response into lines
            lines = generated_text.split('\n')

            # Extract only lines that start with "1." or "2."
            tips = [line.strip() for line in lines if line.strip().startswith(('1.', '2.'))]

            # Fallback in case format is a bit off but tips are there
            if not tips:
                # Attempt to find any bullet-like lines
                tips = [line.strip() for line in lines if len(line.strip()) > 2 and line.strip()[0] in ['1', '2'] and '.' in line]

            return tips if tips else ["Tip parsing failed."]
        
        except Exception as e:
            return [f"Error parsing response: {str(e)}"]
    else:
        return [f"Error: Unable to fetch tips, status code {response.status_code}"]
