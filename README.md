# MyQ Garage Door Control

A mobile app with voice commands and widget controls to open/close a MyQ garage door.

## Features

- **Voice Control**: Use Google Assistant integration to control garage door with voice commands
- **Widget Interface**: Manual control buttons within the mobile app
- **Authentication**: Secure login system
- **Real-time Status**: View current garage door status (open/closed)

## Backend API

This demo backend stores garage door state in an in-memory dictionary and does
not communicate with the official MyQ service or any real hardware.

The FastAPI backend provides the following endpoints:

- `POST /login` - Authenticate user
- `POST /open` - Open garage door
- `POST /close` - Close garage door
- `POST /status` - Get current garage door status
  (send JSON `{ "email": ..., "password": ... }`)

## Setup

### Backend
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

### Mobile App
```bash
cd MyQGarageApp
npm install
npx react-native run-android  # or run-ios
```

## Voice Commands

- "Open garage door"
- "Close garage door"
- "What's the garage door status?"

## Authentication

Default credentials:
- Email: test@example.com
- Password: supersecret
