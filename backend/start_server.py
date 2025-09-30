#!/usr/bin/env python3
"""
Simple script to start the FastAPI server with proper configuration
"""
import uvicorn
import os
from pathlib import Path

# Change to the directory containing this script
script_dir = Path(__file__).parent
os.chdir(script_dir)

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "server:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=[str(script_dir)]
    )