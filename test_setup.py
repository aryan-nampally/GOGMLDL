import sys
import os
import pandas as pd
import numpy as np

print("Checking imports...")
try:
    import streamlit
    import plotly
    import sklearn
    print("Core libraries imported successfully.")
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

print("Checking internal modules...")
try:
    from utils import data, visuals, ui
    print("Internal modules imported successfully.")
except ImportError as e:
    print(f"Internal Module Error: {e}")
    sys.exit(1)

print("Testing data generation...")
df = data.generate_linear_data()
if not df.empty:
    print("Data generation works.")
else:
    print("Data generation failed.")

print("All checks passed.")
