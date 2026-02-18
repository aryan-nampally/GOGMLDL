import streamlit as st
import time
from .base import BaseAgent
from .gamification import GamificationAgent

class QuizAgent(BaseAgent):
    def __init__(self, xp_reward=25):
        super().__init__("Quiz Master")
        self.xp_reward = xp_reward
        self.gamification = GamificationAgent() # Access to XP logic

    def render(self, key, question, options, correct_idx, explanation):
        st.markdown("### 🧠 Quick Check")
        
        # Unique session state key for this quiz instance
        quiz_key = f"quiz_{key}_answered"
        
        if quiz_key not in st.session_state:
            st.session_state[quiz_key] = False

        # If already answered correctly
        if st.session_state[quiz_key]:
            st.success(f"✅ Correct! {self.xp_reward} XP Earned.")
            st.info(f"**Why?** {explanation}")
            return

        choice = st.radio(question, options, key=f"radio_{key}")
        
        if st.button("Submit Answer", key=f"btn_{key}"):
            if options.index(choice) == correct_idx:
                st.session_state[quiz_key] = True
                self.gamification.award_xp(self.xp_reward, "Quiz Correct!")
                st.balloons()
                st.rerun()
            else:
                st.error("Not quite. Try again!")
