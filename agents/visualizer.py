import streamlit as st
import plotly.graph_objects as go
import numpy as np
from .base import BaseAgent

class VisualizerAgent(BaseAgent):
    def __init__(self):
        super().__init__("The Artist")
        
    def plot_regression(self, df, slope=None, intercept=None, title="Regression Analysis", height=500):
        """Standard Regression Plot with optional model line"""
        fig = go.Figure()

        # Scatter of data
        fig.add_trace(go.Scatter(
            x=df['X'], y=df['y'],
            mode='markers',
            name='Data Points',
            marker=dict(color='#4F8BF9', size=8, opacity=0.7)
        ))

        # True relationship (if needed/known) or fitted line
        if slope is not None and intercept is not None:
            # Create line points
            x_range = np.linspace(df['X'].min(), df['X'].max(), 100)
            y_line = slope * x_range + intercept
            
            fig.add_trace(go.Scatter(
                x=x_range, y=y_line,
                mode='lines',
                name='Model Prediction',
                line=dict(color='#EB5E28', width=4)
            ))

        fig.update_layout(
            title=title,
            template="plotly_dark",
            xaxis_title="Input Feature (X)",
            yaxis_title="Target (y)",
            height=height,
            margin=dict(l=40, r=40, t=40, b=40),
            legend=dict(yanchor="top", y=0.99, xanchor="left", x=0.01),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)'
        )
        st.plotly_chart(fig, use_container_width=True)
        
    def plot_residuals(self, y_true, y_pred):
        """Standard Residual Plot"""
        residuals = y_true - y_pred
        fig = go.Figure()
        
        fig.add_trace(go.Scatter(
            x=y_pred, y=residuals,
            mode='markers',
            name='Errors',
            marker=dict(color='#EF476F', size=8, opacity=0.7)
        ))
        
        # Zero line
        fig.add_shape(type="line",
            x0=y_pred.min(), y0=0, x1=y_pred.max(), y1=0,
            line=dict(color="white", width=2, dash="dash")
        )
        
        fig.update_layout(
            title="Residual Plot (Errors)",
            template="plotly_dark",
            xaxis_title="Predicted Values",
            yaxis_title="Residuals (Actual - Predicted)",
            height=350,
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)'
        )
        st.plotly_chart(fig, use_container_width=True)

    def render(self):
        """Main render method (required by BaseAgent)"""
        pass
