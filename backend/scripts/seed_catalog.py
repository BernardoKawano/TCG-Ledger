#!/usr/bin/env python3
"""Run catalog seed."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.database import SessionLocal
from src.catalog.seed import seed_catalog


def main():
    db = SessionLocal()
    try:
        seed_catalog(db)
        print("Catalog seeded successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
