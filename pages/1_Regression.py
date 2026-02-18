import streamlit as st
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
import sys
import os

# Add parent dir to path so we can import agents/utils
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import Agents
from agents.orchestrator import OrchestratorAgent
from agents.concept import ConceptAgent
from agents.quiz import QuizAgent
from agents.experiment import ExperimentAgent
from agents.visualizer import VisualizerAgent
from agents.coder import CoderAgent

# --- 1. INITIALIZE AGENTS ---
orchestrator = OrchestratorAgent()
concept_agent = ConceptAgent()
quiz_agent = QuizAgent(xp_reward=50)
lab_agent = ExperimentAgent()
viz_agent = VisualizerAgent()
coder_agent = CoderAgent()

# --- 2. SETUP PAGE ---
orchestrator.initialize_session()
st.set_page_config(page_title="Regression Lab", page_icon="🧪", layout="wide")
orchestrator.render_sidebar()
orchestrator.render_header("Linear Regression Lab", "🧪")

# --- 3. CONCEPT PHASE ---
# --- 3. CONCEPT PHASE ---
with st.container():
    concept_mode = st.radio(
        "Select Concept Module", 
        ["Basic Intuition (Rope Analogy)", "Gradient Descent (Optimization)", "R-Squared (Goodness of Fit)", "Assumptions Check"],
        horizontal=True
    )
    
    st.divider()
    
    if "Basic" in concept_mode:
        concept_agent.render_regression_intro()
    elif "Gradient" in concept_mode:
        concept_agent.render_gradient_descent()
    elif "R-Squared" in concept_mode:
        concept_agent.render_r_squared()
    elif "Assumptions" in concept_mode:
        concept_agent.render_assumptions()

# --- 4. FIRST QUIZ ---
st.divider()
quiz_agent.render(
    key="q1",
    question="In the rope analogy, what represents the 'Error'?",
    options=["The length of the rope", "The tension in the springs", "The number of magnets", "The color of the rod"],
    correct_idx=1,
    explanation="The springs stretch to connect the points to the line. The more stretched they are (tension), the higher the error!"
)

# --- 5. EXPERIMENT LAB ---
st.divider()
df, true_slope, true_intercept = lab_agent.render()

# --- 6. MODEL TRAINING & VISUALIZATION ---
# Train actual model on the lab data
model = LinearRegression()
X = df[['X']]
y = df['y']
model.fit(X, y)

pred_slope = model.coef_[0]
pred_intercept = model.intercept_
y_pred = model.predict(X)

# Visualize Results
viz_agent.plot_regression(
    df, pred_slope, pred_intercept, 
    title=f"AI's Best Fit: y = {pred_slope:.2f}x + {pred_intercept:.2f}"
)

col_metrics1, col_metrics2 = st.columns(2)
col_metrics1.metric("R² Score", f"{r2_score(y, y_pred):.4f}")
col_metrics2.metric("MSE (Error)", f"{mean_squared_error(y, y_pred):.2f}")

with st.expander("See Residuals (Errors)"):
    viz_agent.plot_residuals(y, y_pred)

# --- 7. CODE SNIPPET ---
st.divider()
coder_agent.render(pred_slope, pred_intercept, len(df))

# --- 8. FINAL CHALLENGE ---
st.divider()
st.markdown("### 🏆 Master Challenge")
if r2_score(y, y_pred) > 0.90:
    st.balloons()
    st.success("High Accuracy Achievement Unlocked! 🎯")
    orchestrator.gamification.award_badge("Regression Master")
else:
    st.info("Try to adjust the 'Noise' slider in the Lab to get R² > 0.90 to unlock the badge!")

# Footer
st.markdown("---")
st.caption("Multi-Agent Learning Platform | Powered by Streamlit")
