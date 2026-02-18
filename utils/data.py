import numpy as np
import pandas as pd
from sklearn.datasets import make_regression, load_iris, load_diabetes, fetch_california_housing

def generate_linear_data(n_samples=100, noise=10, slope=2, intercept=5, random_state=42):
    """
    Generates synthetic linear data: y = slope * x + intercept + noise
    Returns a DataFrame with columns 'X', 'y' and 'y_true' (without noise).
    """
    np.random.seed(random_state)
    X = np.random.rand(n_samples, 1) * 10  # Range 0-10
    noise_array = np.random.randn(n_samples, 1) * noise
    y_true = slope * X + intercept
    y = y_true + noise_array
    
    df = pd.DataFrame({
        'X': X.flatten(),
        'y': y.flatten(),
        'y_true': y_true.flatten()
    })
    return df

def generate_polynomial_data(n_samples=100, noise=10, degree=2, random_state=42):
    """
    Generates synthetic polynomial data.
    """
    np.random.seed(random_state)
    X = np.random.rand(n_samples, 1) * 10 - 5 # Range -5 to 5
    
    # Simple polynomial structure for demo: y = 0.5 * x^2 + x + noise (scaled by degree roughly)
    # We'll make it generic: y = x^degree
    
    # To make it look nice, we often want mixed terms, but for simple polynomial regression visualization:
    y_true = 0.5 * (X ** degree) 
    
    # Add some lower order terms to make it interesting if degree > 1
    if degree > 1:
        y_true += X
        
    noise_array = np.random.randn(n_samples, 1) * noise
    y = y_true + noise_array
    
    df = pd.DataFrame({
        'X': X.flatten(),
        'y': y.flatten(),
        'y_true': y_true.flatten()
    })
    return df

def load_example_dataset(name="diabetes"):
    """
    Loads standard sklearn datasets easier for display.
    """
    if name == "diabetes":
        data = load_diabetes(as_frame=True)
        return data.frame
    elif name == "california":
        data = fetch_california_housing(as_frame=True)
        return data.frame
    elif name == "iris":
        data = load_iris(as_frame=True)
        return data.frame
    return None

def generate_salary_data(n_samples=30, noise=5000, random_state=42):
    """
    Generates synthetic salary data based on years of experience.
    """
    np.random.seed(random_state)
    Experience = np.sort(np.random.rand(n_samples, 1) * 10 + 1) # 1 to 11 years
    
    # Base salary ~30k, + ~8-10k per year
    Salary = 30000 + Experience * 9000 + np.random.randn(n_samples, 1) * noise
    
    df = pd.DataFrame({
        'YearsExperience': Experience.flatten(),
        'Salary': Salary.flatten()
    })
    return df
