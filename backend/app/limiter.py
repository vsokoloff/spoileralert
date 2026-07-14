"""
backend/app/limiter.py

Shared rate limiter (slowapi). Lives in its own module so routers can import
it without a circular import through app.main.

Disabled automatically when ENVIRONMENT is a dev/test value so local work and
the pytest suite aren't throttled.
"""

import os

from slowapi import Limiter
from slowapi.util import get_remote_address

_DEV_ENVIRONMENTS = {"development", "dev", "local", "test"}

limiter = Limiter(
    key_func=get_remote_address,
    enabled=os.getenv("ENVIRONMENT", "").lower() not in _DEV_ENVIRONMENTS
    or os.getenv("FORCE_RATE_LIMIT", "").lower() == "true",
)
