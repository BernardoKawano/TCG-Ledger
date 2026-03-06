"""Pytest configuration."""
import os
import pytest

# Use test database if available
os.environ.setdefault("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/tcg_ledger_test")
# Avoid SECRET_KEY validation in tests
os.environ.setdefault("DEBUG", "true")
