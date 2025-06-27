import logging
from openai import AsyncOpenAI
import sys
from pathlib import Path

# Set up logging
logger = logging.getLogger(__name__)

# Global variable to store the Mistral client instance
_mistral_client = None

# Add parent directory to path to be able to import mistral
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

# Import from mistral.py
from mistral import create_mistral_client, API_KEY, MODEL_NAME

async def get_mistral_client():
    """
    Returns a single Mistral client instance.
    If the client already exists, a new client is not created.
    """
    global _mistral_client
    if _mistral_client is None:
        try:
            _mistral_client = AsyncOpenAI(
                base_url="http://13.203.213.103:8080/v1",
                api_key="trustNoOneEvEr",  # Required even if not checked
            )
            logger.info("Created new Mistral client instance")
        except Exception as e:
            logger.error(f"Error initializing AsyncOpenAI client: {str(e)}")
            # Fallback to the imported function if there's an error
            _mistral_client = create_mistral_client()
            logger.info("Created fallback Mistral client instance")
    
    return _mistral_client 