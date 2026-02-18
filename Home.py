import streamlit as st

# Page Configuration
st.set_page_config(
    page_title="Visual ML Playground",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Load Custom CSS
def local_css(file_name):
    with open(file_name) as f:
        st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)

try:
    local_css("assets/style.css")
except FileNotFoundError:
    st.warning("CSS file not found. Please ensure 'assets/style.css' exists.")


# Hero Section
st.title("🧠 ML ATLAS")
st.markdown("""
### Learn Machine Learning by **Seeing** it Move.
*No heavy math. Just sliders, real data, and instant feedback.*
""")

st.divider()

col1, col2 = st.columns([1, 1])

with col1:
    st.markdown("### 🚀 Start Learning")
    st.info("Select a module from the sidebar to begin your journey.")
    st.markdown("""
    **Available Modules:**
    - 📘 **Regression**: Linear, Polynomial, Regularization
    - 📕 **Classification**: Logistic, KNN, SVM (Coming Soon)
    - 📗 **Clustering**: K-Means, DBSCAN (Coming Soon)
    """)

with col2:
    st.markdown("### 💡 Philosophy")
    st.markdown("""
    > "You don't understand it until you can visualize it."
    
    This playground is built on 3 rules:
    1. **Intuition First**: Plain English explanations.
    2. **Visual Proof**: See the math happening.
    3. **Interactive**: Break things to learn how they work.
    """)

st.divider()

# Footer or Intro to Playground
st.markdown("#### Ready? 👈 Pick a module on the left.")
