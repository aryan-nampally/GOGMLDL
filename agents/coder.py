import streamlit as st
from .base import BaseAgent

class CoderAgent(BaseAgent):
    def __init__(self):
        super().__init__("The Engineer")
        
    def render(self, slope, intercept, n_samples):
        st.markdown("## 3. The Code 💻")
        st.info("Here's how you'd write this model in Python using Scikit-Learn.")
        
        code = f"""
import numpy as np
from sklearn.linear_model import LinearRegression

# 1. Generate Data (Example)
# We use {n_samples} samples based on your lab settings
n_samples = {n_samples}
X = np.random.rand(n_samples, 1) * 10 
y = {slope:.2f} * X + {intercept:.2f} + np.random.randn(n_samples, 1)

# 2. Initialize Model
model = LinearRegression()

# 3. Train Model
model.fit(X, y)

# 4. Check Results
print(f"Learned Slope: {{model.coef_[0][0]:.2f}}")
print(f"Learned Intercept: {{model.intercept_[0]:.2f}}")
        """
        st.code(code, language="python")
