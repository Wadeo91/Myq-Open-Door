# Myq-Open-Door
Open patio

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import asyncio

app = FastAPI()

fake_db = {
    "user": {
        "email": "test@example.com",
        "password": "supersecret",
        "garage_status": "closed"
    }
}

class LoginRequest(BaseModel):
    email: str
    password: str

class CommandResponse(BaseModel):
    status: str
    message: str

class StatusResponse(BaseModel):
    garage_status: str

def authenticate_user(email: str, password: str):
    if email != fake_db["user"]["email"] or password != fake_db["user"]["password"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return True

@app.post("/login", response_model=CommandResponse)
async def login(request: LoginRequest):
    authenticate_user(request.email, request.password)
    return CommandResponse(status="success", message="Logged in successfully.")

@app.post("/open", response_model=CommandResponse)
async def open_garage(request: LoginRequest):
    authenticate_user(request.email, request.password)
    await asyncio.sleep(1)
    fake_db["user"]["garage_status"] = "open"
    return CommandResponse(status="success", message="Garage door opened.")

@app.post("/close", response_model=CommandResponse)
async def close_garage(request: LoginRequest):
    authenticate_user(request.email, request.password)
    await asyncio.sleep(1)
    fake_db["user"]["garage_status"] = "closed"
    return CommandResponse(status="success", message="Garage door closed.")

@app.get("/status", response_model=StatusResponse)
async def get_status(email: str, password: str):
    authenticate_user(email, password)
    return StatusResponse(garage_status=fake_db["user"]["garage_status"])
fastapi
uvicorn
services:
  - type: web
    name: myq-garage-backend
    env: python
    plan: free
    buildCommand: ""
    startCommand: uvicorn main:app --host 0.0.0.0 --port 10000
    envVars: []
fastapi
uvicorn
services:
  - type: web
    name: myq-garage-backend
    env: python
    plan: free
    buildCommand: ""
    startCommand: uvicorn main:app --host 0.0.0.0 --port 10000
    envVars: []