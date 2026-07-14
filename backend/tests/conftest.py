"""
Test configuration — loaded by pytest before any test module.

Marks the environment as "test" so:
  * app.auth allows the default SECRET_KEY fallback (tests also set their own).
  * app.limiter disables rate limiting (the whole suite comes from one client
    IP, so real limits would cause spurious 429s).
"""

import os

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
