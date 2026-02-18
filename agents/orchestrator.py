import streamlit as st
from .base import BaseAgent
from .gamification import GamificationAgent

class OrchestratorAgent(BaseAgent):
    def __init__(self):
        super().__init__("Orchestrator")
        self.gamification = GamificationAgent()
        
    def initialize_session(self):
        """Sets up session state variables for the learning journey"""
        if "user_xp" not in st.session_state:
            st.session_state.user_xp = 0
        if "user_level" not in st.session_state:
            st.session_state.user_level = 1
        if "badges" not in st.session_state:
            st.session_state.badges = []
            
    def render_sidebar(self):
        """Renders the gamification sidebar"""
        self.gamification.render()
        
    def render_header(self, title, icon):
        """Renders the main page header"""
        st.title(f"{icon} {title}")
        st.markdown("---")

    def render(self):
        """Main render method (required by BaseAgent)"""
        # Orchestrator doesn't have a single render block, 
        # it manages others via specific methods.
        pass
