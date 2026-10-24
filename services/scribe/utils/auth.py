# utils/auth.py
import os
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

# Configuration – read from env or defaults
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

bearer = HTTPBearer(auto_error=False)

async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    """Extract and verify JWT token, returning the payload.
    In the original Express code `protect` middleware attaches a user object; here we mimic that.
    """
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    # Expected payload contains an "id" field (Mongo ObjectId string)
    if "id" not in payload:
        raise HTTPException(status_code=401, detail="Token missing user id")
    return payload
