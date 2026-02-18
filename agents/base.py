from abc import ABC, abstractmethod
import streamlit as st

class BaseAgent(ABC):
    def __init__(self, name: str):
        self.name = name

    def log(self, message: str):
        """Internal logging (could be expanded to UI logs)"""
        print(f"[{self.name}] {message}")

    @abstractmethod
    def render(self, *args, **kwargs):
        """Main method to render the agent's UI component"""
        pass
