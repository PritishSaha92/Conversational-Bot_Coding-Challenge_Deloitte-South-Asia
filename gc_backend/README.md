# OpenSoft Backend - HR Assistant Platform

A comprehensive backend system for employee communication and HR analytics, featuring a chatbot interface, WebSocket-based real-time communication, and automated HR reports generation.

## Overview

This project provides a Django-based backend system focused on:

1. **Employee Chat Interface**: Real-time communication through WebSockets
2. **AI-Powered HR Assistant**: Integration with Mistral AI for intelligent responses
3. **Analytics & Reporting**: Automated generation of HR reports based on chat interactions
4. **Data Processing**: Scripts for analyzing employee data and identifying potential issues

## Features

### Real-time Communication
- WebSocket-based chat system
- Support for multiple chat rooms
- Message streaming for responsive interactions
- Persistent chat history

### AI Integration
- Integration with Mistral AI LLM for intelligent responses
- Conversation context maintenance
- Real-time message streaming
- Fallback mechanisms for API reliability

### HR Analytics
- Automated generation of HR reports from chat history
- Employee distress detection and analysis
- Data visualization and metrics
- Structured JSON output for further processing

### Data Processing
- CSV file upload and processing
- Multiple dataset integration
- Employee performance and sentiment analysis
- Anomaly detection in employee data

## Project Structure

```
gc_backend/
├── accounts/               # User authentication and management
├── employee/               # Employee data and chat message models
├── gc_backend/             # Core application
│   ├── consumers.py        # WebSocket consumers for real-time chat
│   ├── mistral_utils.py    # Utilities for Mistral AI integration
│   ├── routing.py          # WebSocket routing configuration
│   ├── settings.py         # Django settings
│   ├── summarizer.py       # Chat summarization and HR report generation
│   └── csv_processor/      # CSV file processing utilities
├── datasets/               # Sample data and CSV files
├── scripts/                # Data processing scripts
│   ├── master_df_gen.py    # Master dataframe generation
│   └── distressed_df_gen.py # Distressed employee detection
├── mistral.py              # Mistral AI client and prompt generation
└── manage.py               # Django management script
```

## Technical Stack

- **Framework**: Django + Django Channels
- **Real-time Communication**: WebSockets via Django Channels
- **Database**: Django ORM with SQLite/PostgreSQL
- **AI Integration**: Mistral AI via REST API
- **Authentication**: JWT-based authentication
- **Data Processing**: Pandas, NumPy
- **API**: REST API endpoints with Django REST Framework

## API Endpoints

### Authentication
- `POST /api/auth/login/`: User login
- `POST /api/auth/register/`: User registration

### Chat Messages
- `GET /api/messages/<user_id>/`: Get all messages for a user
- `POST /api/messages/`: Store user message and system response

### CSV Processing
- `POST /api/process-hr-metrics/`: Upload and process HR data CSV files

## WebSocket Interface

### Connection
- Connect to: `ws://<host>/ws/chat/<room_name>/`
- Send connection event with username

### Message Types
- `connection`: Establish a connection with username
- `chatbot_query`: Send a message to the chatbot
- `disconnect_request`: Request to disconnect from the chat

### Response Types
- `connection_confirmed`: Connection established
- `chatbot_stream`: Real-time streaming chatbot response chunks
- `chatbot_response`: Complete chatbot response
- `user_connect`: User joined notification
- `user_disconnect`: User left notification

## HR Report Generation

When a user disconnects from a chat session, the system automatically:
1. Captures the complete chat history
2. Analyzes the conversation using AI
3. Generates a comprehensive HR report
4. Saves the report as a structured JSON file

The HR report includes:
- Employee summary
- Key insights from the conversation
- Risk assessment
- Recommended actions

## Installation and Setup

### Prerequisites
- Python 3.8+
- Django 4.0+
- Redis (for production channel layers)

### Installation Steps

1. Clone the repository
```bash
git clone <repository-url>
cd open-soft-backend
```

2. Set up a virtual environment
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Configure environment variables
```bash
cp .env.example .env
# Edit .env file with your settings
```

5. Run migrations
```bash
python manage.py migrate
```

6. Start the development server
```bash
python manage.py runserver
```

## Usage

### Starting the Chat Service
1. Ensure the Django server is running
2. Connect to the WebSocket endpoint from your frontend
3. Send a connection event with username
4. Start sending messages

### Generating HR Reports
- Reports are automatically generated when a user disconnects
- Reports are saved to the `chat_summaries` directory
- Each report is named with the employee ID and timestamp

### Processing CSV Data
1. Upload CSV files via the web interface or API
2. The system processes the files and generates analytics
3. Access the results via the API endpoints

## Development

### Running Tests
```bash
python manage.py test
```

### Adding New Features
1. Create a feature branch
2. Implement your changes
3. Add tests
4. Submit a pull request

## License

[MIT License](LICENSE)

## Contributors

- [Your Name/Team]

## Acknowledgements

- [Mistral AI](https://mistral.ai) for AI capabilities
- Django and Django Channels communities
- Open source libraries used in this project 