import streamlit as st
import numpy as np
import pandas as pd
from .base import BaseAgent

class ExperimentAgent(BaseAgent):
    def __init__(self):
        super().__init__("The Lab")
        
    def render(self, key_prefix="exp"):
        st.markdown("## 2. The Laboratory 🧪")
        st.info("Design your own experiment. Change the data and see what happens!")
        
        c1, c2 = st.columns(2)
        with c1:
            st.markdown("**Data Generator**")
            n_samples = st.slider("Number of Samples", 10, 200, 50, key=f"{key_prefix}_n")
            noise = st.slider("Messiness (Noise)", 0, 50, 15, key=f"{key_prefix}_noise")
            
        with c2:
            st.markdown("**True Underlying Rule**")
            slope = st.slider("True Slope", -5.0, 5.0, 2.5, key=f"{key_prefix}_slope")
            intercept = st.slider("True Intercept", -10.0, 10.0, 0.0, key=f"{key_prefix}_int")
            
        # Generate Data
        np.random.seed(42)
        X = np.random.rand(n_samples, 1) * 10
        y_true = slope * X + intercept
        y = y_true + np.random.randn(n_samples, 1) * noise
        
        df = pd.DataFrame({'X': X.flatten(), 'y': y.flatten()})
        return df, slope, intercept
