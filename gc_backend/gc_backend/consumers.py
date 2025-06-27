import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
import logging
import asyncio
import sys
import os
import uuid
from pathlib import Path
from datetime import datetime
from django.utils import timezone
from openai import AsyncOpenAI
from .summarizer import generate_hr_summary_from_inputs
from .mistral_utils import get_mistral_client

# Add parent directory to path to be able to import mistral
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

# Import components from mistral.py
from mistral import generate_prompt, API_KEY, MODEL_NAME

from employee.models import ChatMessage

User = get_user_model()
logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Initialize user variables
        self.username = None
        self.user_id = None
        self.employee_id = None
        
        # Get the shared Mistral client instance
        self.mistral_client = await get_mistral_client()
        
        # mistral_messages will be initialized when we get the employee_id
        self.mistral_messages = None
    
    async def disconnect(self, close_code):
        # Log disconnection
        if self.username:
            logger.info(f"WebSocket disconnected: user_id={self.user_id}, username={self.username}, room={self.room_name}, code={close_code}")
            
            # Fetch all chat messages for the user in time order
            if self.user_id:
                chat_messages = await self.get_chat_messages(self.user_id)
            else:
                chat_messages = []
            
            # Create JSON object to store chat history
            user = None
            if self.user_id:
                user = await self.get_user_by_id(self.user_id)
            
            chat_history_json = {
                'count': len(chat_messages),
                'user': {
                    'id': self.user_id,
                    'username': self.username,
                    'profile_pic': user.profile_pic if user else None
                },
                'messages': chat_messages
            }
            
            
            # Send disconnect message to room group with chat history
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "user_disconnect",
                    "message": f"{self.username} left the room",
                    "user_id": self.user_id,
                    "username": self.username,
                    "chat_messages": chat_messages,
                    "chat_history": chat_history_json
                }
            )

            # Don't block connection closing - start HR summary generation in background
            asyncio.create_task(self.summarize(chat_history_json))
        
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get("type", "message")
        
        if message_type == "connection":
            # Handle connection event with username
            username = text_data_json.get("username")
            
            if not username:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "Username is required for connection"
                }))
                return
                
            # Store client session info
            self.username = username
            
            # Get or create user by username
            user = await self.get_or_create_user(username)
            self.user_id = user.id
            
            # Use the user's company_id as the employee_id for Mistral
            self.employee_id = user.company_id
            
            # Initialize Mistral conversation history using the employee_id
            self.mistral_messages = generate_prompt(self.employee_id)
            
            # Get chat messages for the user
            chat_messages = await self.get_chat_messages(user.id)
            
            # Send confirmation with messages
            await self.send(text_data=json.dumps({
                "type": "connection_confirmed",
                "user_id": self.user_id,
                "employee_id": self.employee_id,
                "chat_messages": chat_messages
            }))
            
            # Log connection
            logger.info(f"WebSocket connection established: user_id={self.user_id}, username={self.username}, employee_id={self.employee_id}, room={self.room_name}")
            
            # Send connection message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "user_connect",
                    "message": f"{self.username} joined the room",
                    "user_id": self.user_id,
                    "username": self.username
                }
            )
        elif message_type == "disconnect_request":
            # Handle explicit disconnect request
            # Log user-initiated disconnection
            logger.info(f"User initiated disconnect: user_id={self.user_id}, username={self.username}, room={self.room_name}")
            
            # Fetch user's chat messages
            if self.user_id:
                chat_messages = await self.get_chat_messages(self.user_id)
            else:
                chat_messages = []
            
            # Send success response to the client
            await self.send(text_data=json.dumps({
                "type": "disconnect_confirmed",
                "message": "Chat session ended successfully",
                "chat_messages": chat_messages
            }))
        elif message_type == "chatbot_query":
            # Ensure the user has established a connection first
            if not self.user_id:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "Please establish a connection first with a connection event"
                }))
                return
                
            # Handle chatbot query
            query = text_data_json.get("message", "")
            logger.info(f"Chatbot query received: {query} from user: {self.username}, employee_id: {self.employee_id}")
            
            # Save the user message to the database
            user = await self.get_user_by_id(self.user_id)
            await self.save_chat_message(
                user=user,
                message=query,
                direction="sent"
            )
            
            # Process through Mistral AI
            await self.process_with_mistral(query)
        else:
            # Regular chat message - we don't handle this in this implementation
            pass
    
    # Process query with Mistral AI
    async def process_with_mistral(self, query):
        try:
            # Add user message to conversation history
            user_prompt = {"role": "user", "content": query}
            self.mistral_messages.append(user_prompt)
            
            # Call Mistral API with the new interface
            try:
                async_response = await self.mistral_client.chat.completions.create(
                    model='l1',
                    messages=self.mistral_messages,
                    stream=True,
                )
                
                # Flag to indicate which client interface we're using
                using_new_client = True
            except (AttributeError, TypeError):
                # Fallback to the old interface if the new one fails
                async_response = await self.mistral_client.chat.stream_async(
                    messages=self.mistral_messages,
                    model=MODEL_NAME
                )
                
                # Flag to indicate we're using the old client interface
                using_new_client = False
            
            # Process streamed response
            response_text = ""
            async for chunk in async_response:
                if using_new_client:
                    if chunk.choices[0].delta and chunk.choices[0].delta.content:
                        chunk_text = chunk.choices[0].delta.content
                        response_text += chunk_text
                        
                        # Send real-time updates for streaming effect
                        await self.send(text_data=json.dumps({
                            "type": "chatbot_stream",
                            "chunk": chunk_text,
                            "user_id": "chatbot",
                            "username": "HR Assistant"
                        }))
                else:
                    # Old client interface
                    if chunk.data.choices[0].delta.content:
                        chunk_text = chunk.data.choices[0].delta.content
                        response_text += chunk_text
                        
                        # Send real-time updates for streaming effect
                        await self.send(text_data=json.dumps({
                            "type": "chatbot_stream",
                            "chunk": chunk_text,
                            "user_id": "chatbot",
                            "username": "HR Assistant"
                        }))
            
            # Add assistant's response to conversation history
            self.mistral_messages.append({
                "role": "assistant",
                "content": response_text
            })
            
            # Save the assistant's response to the database
            user = await self.get_user_by_id(self.user_id)
            await self.save_chat_message(
                user=user,
                message=response_text,
                direction="received"
            )
            
            # Send the final complete response
            await self.send(text_data=json.dumps({
                "type": "chatbot_response",
                "message": response_text,
                "user_id": "chatbot",
                "username": "HR Assistant"
            }))
        except Exception as e:
            logger.error(f"Error processing with Mistral: {str(e)}")
            error_message = f"Sorry, I encountered an error: {str(e)}"
            
            # Save the error message to the database
            if self.user_id:
                user = await self.get_user_by_id(self.user_id)
                await self.save_chat_message(
                    user=user,
                    message=error_message,
                    direction="received"
                )
            
            await self.send(text_data=json.dumps({
                "type": "chatbot_response",
                "message": error_message,
                "user_id": "chatbot",
                "username": "HR Assistant"
            }))
    
    # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]
        user_id = event["user_id"]
        username = event["username"]
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "type": "message",
            "message": message,
            "user_id": user_id,
            "username": username
        }))
    
    # Receive connection notification from room group
    async def user_connect(self, event):
        message = event["message"]
        user_id = event["user_id"]
        username = event["username"]
        
        # Send connection notification to WebSocket
        await self.send(text_data=json.dumps({
            "type": "connect",
            "message": message,
            "user_id": user_id,
            "username": username
        }))
    
    # Receive disconnection notification from room group
    async def user_disconnect(self, event):
        message = event["message"]
        user_id = event["user_id"]
        username = event["username"]
        chat_messages = event.get("chat_messages", [])
        chat_history = event.get("chat_history", {})
        
        # Send disconnection notification to WebSocket
        await self.send(text_data=json.dumps({
            "type": "disconnect",
            "message": message,
            "user_id": user_id,
            "username": username,
            "chat_messages": chat_messages,
            "chat_history": chat_history
        }))
    
    # Database access methods
    @database_sync_to_async
    def get_or_create_user(self, username):
        """Get or create a user with the given username"""
        try:
            # Try to get existing user first
            user = User.objects.get(username=username)
            # Check if company_id is empty, if so, assign a unique value
            if not user.company_id:
                unique_id = f"CHAT_{uuid.uuid4().hex[:8].upper()}"
                user.company_id = unique_id
                user.save()
            return user
        except User.DoesNotExist:
            # Create new user with a unique company_id
            unique_id = f"CHAT_{uuid.uuid4().hex[:8].upper()}"
            user = User.objects.create(
                username=username,
                email=f"{username}@example.com",
                company_id=unique_id,
                role='employee'
            )
            return user
    
    @database_sync_to_async
    def get_user_by_id(self, user_id):
        """Get a user by ID"""
        return User.objects.get(id=user_id)
    
    @database_sync_to_async
    def get_chat_messages(self, user_id):
        """Get all chat messages for a user"""
        messages = ChatMessage.objects.filter(user_id=user_id).order_by('timestamp')
        
        # Convert to a list of dicts for serialization that matches ChatMessageSerializer format
        return [
            {
                'id': msg.id,
                'message': msg.message,
                'direction': msg.direction,
                'timestamp': msg.timestamp.isoformat(),
                'user': {
                    'id': msg.user.id,
                    'username': msg.user.username,
                    'profile_pic': msg.user.profile_pic
                }
            }
            for msg in messages
        ]
    
    @database_sync_to_async
    def save_chat_message(self, user, message, direction):
        """Save a chat message to the database"""
        return ChatMessage.objects.create(
            user=user,
            message=message,
            direction=direction
        )
    
    async def summarize(self, chat_history_json):
        """
        Generate HR summary for the employee based on chat history
        This runs as a background task and doesn't block the WebSocket shutdown
        """
        try:
            logger.info(f"Generating HR summary for employee: {self.employee_id}")
            
            # Use absolute path for the CSV file
            csv_file_path = os.path.join(BASE_DIR, "anomaly_summary.csv")
            
            # If file doesn't exist in the base directory, try looking in the current directory
            if not os.path.exists(csv_file_path):
                csv_file_path = os.path.join(os.path.dirname(__file__), "anomaly_summary.csv")
            
            # Log the path we're using
            logger.info(f"Using CSV file path: {csv_file_path}")
            
            logger.info(f"Generating HR summary for employee {self.employee_id}")
            
            # Generate the HR summary
            summary_json = await generate_hr_summary_from_inputs(
                employee_id=self.employee_id,
                csv_file_path=csv_file_path,
                chat_history_json=chat_history_json
            )
            
            # Create a directory for summaries if it doesn't exist
            summaries_dir = os.path.join(BASE_DIR, "chat_summaries")
            os.makedirs(summaries_dir, exist_ok=True)
            
            # Create a filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            summary_filename = f"{self.employee_id}_summary_{timestamp}.json"
            summary_file_path = os.path.join(summaries_dir, summary_filename)
            
            # Save the summary to a file
            with open(summary_file_path, 'w') as f:
                f.write(summary_json)
            
            logger.info(f"HR summary saved to: {summary_file_path}")
            
            logger.info(f"Successfully generated HR summary for employee: {self.employee_id}")
            return summary_json
        except Exception as e:
            logger.error(f"Error generating HR summary: {str(e)}")
            return json.dumps({"error": f"Failed to generate HR summary: {str(e)}"}) 