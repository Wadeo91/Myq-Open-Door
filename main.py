from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/status", response_model=StatusResponse)
async def get_status(request: LoginRequest):
    authenticate_user(request.email, request.password)
    return StatusResponse(garage_status=fake_db["user"]["garage_status"])
