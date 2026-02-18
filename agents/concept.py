import streamlit as st
import numpy as np
import pandas as pd
import os
import plotly.graph_objects as go
from .base import BaseAgent

# Path to pre-rendered Manim animation videos
MANIM_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "manim", "videos", "manim_animations", "1080p60")

class ConceptAgent(BaseAgent):
    def __init__(self):
        super().__init__("Concept Teacher")
        
    def render(self):
        """Main render method (can be specialized for different concepts)"""
        pass
        
    def render_regression_intro(self):
        st.markdown("## 1. Assume YOU are the machine 🤖")
        st.info("Goal: Draw a line that fits the points best. The computer does exactly this, just faster!")

        # Manim Animation
        video_path = os.path.join(MANIM_DIR, "LinearFitAnim.mp4")
        if os.path.exists(video_path):
            with st.expander("🎬 Watch: How Linear Regression Finds the Best Fit", expanded=True):
                st.video(video_path)
        
        col1, col2 = st.columns([1, 1])
        
        with col1:
            st.markdown("### 🪢 The Rope Analogy")
            st.markdown("""
            Imagine the **regression line** is a stiff rod, and each data point is pulling it with a **spring** (the red lines).
            
            The rod will naturally settle where the **tension (error)** is minimized.
            """)
            
            st.markdown("---")
            st.caption("Try it yourself 👇")
            
            # Interactive Diagram Params
            slope = st.slider("Tilt the Rod (Slope)", -5.0, 5.0, 1.0, key="concept_slope")
            intercept = st.slider("Move Up/Down (Intercept)", -5.0, 5.0, 0.0, key="concept_int")
            
        with col2:
            # Generate mini data for concept
            x = np.array([-2, -1, 0, 1, 2])
            y = np.array([-1, -0.5, 0, 0.8, 1.5]) # Slightly noisy
            
            # Calculate user line
            y_pred = slope * x + intercept
            
            # Calculate error (tension)
            error = np.sum((y - y_pred)**2)
            
            fig = go.Figure()
            
            # Data Points
            fig.add_trace(go.Scatter(x=x, y=y, mode='markers', marker=dict(size=12, color='#4F8BF9'), name='Data (Magnets)'))
            
            # The Rod
            fig.add_trace(go.Scatter(x=x, y=y_pred, mode='lines', line=dict(width=5, color='#EB5E28'), name='The Rod'))
            
            # The Springs (Residuals)
            for i in range(len(x)):
                fig.add_shape(type="line",
                    x0=x[i], y0=y[i],
                    x1=x[i], y1=y_pred[i],
                    line=dict(color="#EF476F", width=2, dash="dot")
                )
                
            fig.update_layout(
                title=f"Total Tension (Error): {error:.2f}",
                xaxis_title="", yaxis_title="",
                height=300,
                margin=dict(l=20, r=20, t=40, b=20),
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                showlegend=False
            )
            st.plotly_chart(fig, use_container_width=True)

    def render_gradient_descent(self):
        st.markdown("## 🧠 Gradient Descent: Walking Down the Hill")
        st.info("The computer finds the best line by minimizing the Error (Cost). Think of it as a ball rolling down a valley.")

        # Manim Animation
        video_path = os.path.join(MANIM_DIR, "GradientDescentAnim.mp4")
        if os.path.exists(video_path):
            with st.expander("🎬 Watch: Gradient Descent in Action", expanded=True):
                st.video(video_path)
        
        c1, c2 = st.columns([1, 2])
        with c1:
            st.markdown("**Controls**")
            lr = st.slider("Learning Rate (Step Size)", 0.01, 1.0, 0.1)
            iterations = st.slider("Iterations (Steps)", 0, 50, 0)
            
            st.markdown(f"**Step {iterations}**")
            
        with c2:
            # Create a simple parabolic cost function surface: J(w) = w^2
            # 3D Plot
            w = np.linspace(-10, 10, 100)
            cost = w**2
            
            # Simple simulation of GD
            current_w = 9.0 # Start high
            path_w = [current_w]
            path_cost = [current_w**2]
            
            for _ in range(iterations):
                gradient = 2 * current_w
                current_w = current_w - lr * gradient
                path_w.append(current_w)
                path_cost.append(current_w**2)
                
            fig = go.Figure()
            
            # The Valley (Cost Function)
            fig.add_trace(go.Scatter(x=w, y=cost, mode='lines', name='Cost Curve', line=dict(color='#4F8BF9')))
            
            # The Ball (Current Position)
            fig.add_trace(go.Scatter(
                x=[current_w], y=[current_w**2], 
                mode='markers', name='Current Weights',
                marker=dict(size=15, color='#EB5E28', symbol='circle')
            ))
            
            # The Path
            fig.add_trace(go.Scatter(
                x=path_w, y=path_cost,
                mode='lines+markers', name='Path',
                marker=dict(size=5, color='gray'),
                line=dict(dash='dot')
            ))
            
            fig.update_layout(
                title="Gradient Descent Visualization",
                xaxis_title="Weights (Parameter)",
                yaxis_title="Cost (Error)",
                height=400,
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)'
            )
            st.plotly_chart(fig, use_container_width=True)
            
    def render_r_squared(self):
        st.markdown("## 📊 R-Squared: How good is the fit?")
        st.warning("R² = 1 - (Unexplained Variation / Total Variation)")

        # Manim Animation
        video_path = os.path.join(MANIM_DIR, "RSquaredAnim.mp4")
        if os.path.exists(video_path):
            with st.expander("🎬 Watch: Understanding R-Squared Visually", expanded=True):
                st.video(video_path)
        
        # Generate data
        x = np.linspace(0, 10, 20)
        y_perfect = 2 * x + 1
        noise = np.random.randn(20) * 3
        y = y_perfect + noise
        
        y_mean = np.mean(y)
        
        # Fit line
        coeffs = np.polyfit(x, y, 1)
        y_pred = coeffs[0] * x + coeffs[1]
        
        show_mean = st.checkbox("Show Total Variation (Mean Line)", value=True)
        show_fit = st.checkbox("Show Unexplained Variation (Regression Line)", value=True)
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=x, y=y, mode='markers', name='Data'))
        
        if show_mean:
            fig.add_trace(go.Scatter(x=x, y=[y_mean]*20, mode='lines', name='Mean Line', line=dict(dash='dash', color='gray')))
            # Draw lines for Total Variation
            for i in range(len(x)):
                fig.add_shape(type="line", x0=x[i], y0=y[i], x1=x[i], y1=y_mean, line=dict(color="gray", width=1), opacity=0.3)
                
        if show_fit:
            fig.add_trace(go.Scatter(x=x, y=y_pred, mode='lines', name='Best Fit', line=dict(color='#EB5E28')))
            # Draw lines for Unexplained Variation
            for i in range(len(x)):
                 fig.add_shape(type="line", x0=x[i], y0=y[i], x1=x[i], y1=y_pred[i], line=dict(color="#EF476F", width=2))

        fig.update_layout(title="Visualizing R-Squared", height=400)
        st.plotly_chart(fig, use_container_width=True)
        
    def render_assumptions(self):
        st.markdown("## 🕵️ Assumptions of Linear Regression")
        st.markdown("Linear Regression only works well if your data follows these rules:")
        
        c1, c2, c3, c4 = st.columns(4)
        c1.info("**1. Linearity**\n\nX and Y must have a straight-line relationship.")
        c2.info("**2. Normality**\n\nThe errors should be bell-curve shaped.")
        c3.info("**3. Homoscedasticity**\n\nThe error variance should be constant.")
        c4.info("**4. Independence**\n\nErrors shouldn't be related to each other.")
        
        # Simple interactive check
        violation = st.selectbox("Simulate Violation", ["None (Perfect)", "Non-Linearity (Curved)", "Heteroscedasticity (Cone Shape)"])
        
        x = np.linspace(1, 10, 100)
        if violation == "None (Perfect)":
            y = 2*x + np.random.normal(0, 2, 100)
        elif violation == "Non-Linearity (Curved)":
            y = 2*x**2 + np.random.normal(0, 5, 100)
        else:
            y = 2*x + np.random.normal(0, x*2, 100) # Noise grows with x
            
        # Fit model
        coeffs = np.polyfit(x, y, 1)
        y_pred = coeffs[0] * x + coeffs[1]
        residuals = y - y_pred
        
        # Residual Plot
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=y_pred, y=residuals, mode='markers', marker=dict(color='#EF476F')))
        fig.add_shape(type="line", x0=min(y_pred), y0=0, x1=max(y_pred), y1=0, line=dict(color="white", dash="dash"))
        
        fig.update_layout(
            title=f"Residual Plot: Checking {violation}",
            xaxis_title="Predicted Values",
            yaxis_title="Residuals",
            height=350
        )
        st.plotly_chart(fig, use_container_width=True)
