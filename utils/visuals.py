import plotly.graph_objects as go
import plotly.express as px
import numpy as np
import pandas as pd

def plot_regression_line(df, slope=None, intercept=None, title="Linear Regression"):
    """
    Plots the scatter points and optionally the regression line.
    If slope and intercept are provided, draws the line y = slope * x + intercept.
    """
    fig = go.Figure()

    # Scatter of data
    fig.add_trace(go.Scatter(
        x=df['X'], y=df['y'],
        mode='markers',
        name='Data',
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
            name='Model Line',
            line=dict(color='#EB5E28', width=4)
        ))

    fig.update_layout(
        title=title,
        template="plotly_dark",
        xaxis_title="Input Feature (X)",
        yaxis_title="Target (y)",
        autosize=True,
        margin=dict(l=40, r=40, t=40, b=40),
        legend=dict(yanchor="top", y=0.99, xanchor="left", x=0.01),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
    )
    
    return fig

def plot_residuals(y_true, y_pred):
    residuals = y_true - y_pred
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=y_pred, y=residuals,
        mode='markers',
        marker=dict(color='#EF476F', size=8, opacity=0.7)
    ))
    
    # Zero line
    fig.add_shape(type="line",
        x0=y_pred.min(), y0=0, x1=y_pred.max(), y1=0,
        line=dict(color="white", width=2, dash="dash")
    )
    
    fig.update_layout(
        title="Residual Plot",
        template="plotly_dark",
        xaxis_title="Predicted Values",
        yaxis_title="Residuals (Errors)",
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
    )
    return fig
