import streamlit as st

def load_css():
    """Loads the custom CSS from assets/style.css"""
    try:
        with open("d:/MLGRPHY/assets/style.css") as f:
            st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)
    except FileNotFoundError:
        pass # Handle gracefully if path differs in dev

def setup_page(title, icon):
    """
    Standard page setup wrapper. 
    Note: st.set_page_config must be called at the very top of the script, 
    so this function primarily handles styling and headers.
    """
    load_css()
    st.title(f"{icon} {title}")
    st.markdown("---")

def section_header(title):
    """Generates a styled section header."""
    st.markdown(f"## {title}")

def text_card(text, type="info"):
    """
    Displays text in a styled card.
    Type can be 'info', 'success', 'warning', 'error'.
    """
    if type == "info":
        st.info(text)
    elif type == "success":
        st.success(text)
    elif type == "warning":
        st.warning(text)
    elif type == "error":
        st.error(text)
    else:
        st.markdown(f"""
        <div class="stCard">
            {text}
        </div>
        """, unsafe_allow_html=True)
