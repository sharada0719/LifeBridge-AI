from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any
from .. import crud, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    return crud.create_user(db=db, user=user)

# Standard OAuth2 form-compatible login (used by Swagger UI Docs)
@router.post("/login", response_model=schemas.Token)
def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}
    )
    return {"access_token": access_token, "token_type": "bearer"}

# JSON-based login endpoint (preferred for frontends)
class LoginRequest(schemas.BaseModel):
    email: str
    password: str

@router.post("/login/json", response_model=schemas.Token)
def login_json(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
) -> Any:
    user = crud.get_user_by_email(db, email=credentials.email)
    if not user or not auth.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    return current_user
