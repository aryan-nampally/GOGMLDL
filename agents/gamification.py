import streamlit as st
import time

class GamificationAgent:
    def __init__(self):
        self.name = "Gamification"

    def render(self):
        """Displays the gamification sidebar"""
        with st.sidebar:
            st.markdown("### 🏆 Your Progress")
            
            xp = st.session_state.get("xp", 0)
            level = st.session_state.get("level", 1)
            
            cols = st.columns([1, 3])
            cols[0].markdown(f"**Lvl {level}**")
            cols[1].progress(xp % 100 / 100)
            
            st.caption(f"XP: {xp} / {level * 100}")
            
            st.markdown("---")
            st.markdown("**Badges**")
            badges = st.session_state.get("badges", [])
            if not badges:
                st.caption("No badges yet. Keep learning!")
            else:
                for badge in badges:
                    st.markdown(f"🏅 **{badge}**")

    def award_xp(self, amount, reason="Task Complete"):
        """Awards XP and handles level up animation"""
        if "xp" not in st.session_state:
            st.session_state.xp = 0
            
        old_level = st.session_state.get("level", 1)
        st.session_state.xp += amount
        
        # Simple Logic: Level up every 100 XP
        new_level = 1 + (st.session_state.xp // 100)
        
        if new_level > old_level:
            st.session_state.level = new_level
            st.toast(f"🎉 LEVEL UP! You are now Level {new_level}!", icon="🔥")
            st.balloons()
        else:
            st.toast(f"+{amount} XP: {reason}", icon="⭐")

    def award_badge(self, badge_name):
        """Awards a unique badge"""
        if "badges" not in st.session_state:
            st.session_state.badges = []
            
        if badge_name not in st.session_state.badges:
            st.session_state.badges.append(badge_name)
            st.toast(f"🏅 BADGE UNLOCKED: {badge_name}", icon="🏆")
            time.sleep(1)
            st.balloons()
