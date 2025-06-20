from fastapi import FastAPI, HTTPException, Depends
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

async def get_current_user(request: LoginRequest) -> dict:
    if request.email != fake_db["user"]["email"] or request.password != fake_db["user"]["password"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return fake_db["user"]

@app.post("/login", response_model=CommandResponse)
async def login(user: dict = Depends(get_current_user)):
    return CommandResponse(status="success", message="Logged in successfully.")

@app.post("/open", response_model=CommandResponse)
async def open_garage(user: dict = Depends(get_current_user)):
    await asyncio.sleep(1)
    fake_db["user"]["garage_status"] = "open"
    return CommandResponse(status="success", message="Garage door opened.")

@app.post("/close", response_model=CommandResponse)
async def close_garage(user: dict = Depends(get_current_user)):
    await asyncio.sleep(1)
    fake_db["user"]["garage_status"] = "closed"
    return CommandResponse(status="success", message="Garage door closed.")

@app.post("/status", response_model=StatusResponse)
async def get_status(user: dict = Depends(get_current_user)):
    return StatusResponse(garage_status=fake_db["user"]["garage_status"])
