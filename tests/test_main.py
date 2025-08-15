import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from main import app

client = TestClient(app)

LOGIN_DATA = {"email": "test@example.com", "password": "supersecret"}


def test_login_success():
    response = client.post("/login", json=LOGIN_DATA)
    assert response.status_code == 200
    assert response.json() == {
        "status": "success",
        "message": "Logged in successfully."
    }


def test_open_and_close_garage():
    response = client.post("/open", json=LOGIN_DATA)
    assert response.status_code == 200
    assert response.json()["message"] == "Garage door opened."

    status_resp = client.get("/status", params=LOGIN_DATA)
    assert status_resp.status_code == 200
    assert status_resp.json()["garage_status"] == "open"

    response = client.post("/close", json=LOGIN_DATA)
    assert response.status_code == 200
    assert response.json()["message"] == "Garage door closed."

    status_resp = client.get("/status", params=LOGIN_DATA)
    assert status_resp.status_code == 200
    assert status_resp.json()["garage_status"] == "closed"


def test_retrieve_status():
    status_resp = client.get("/status", params=LOGIN_DATA)
    assert status_resp.status_code == 200
    assert status_resp.json()["garage_status"] in {"open", "closed"}

