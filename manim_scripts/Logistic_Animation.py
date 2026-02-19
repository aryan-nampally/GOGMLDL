from manim import *
import numpy as np

class LogReg(Scene):
    def construct(self):
        # 1. Setup
        title = Text("Logistic Regression: The S-Curve", font_size=36).to_edge(UP)
        self.play(Write(title))

        ax = Axes(
            x_range=[-6, 6, 1],
            y_range=[-0.5, 1.5, 0.5],
            x_length=10,
            y_length=5,
            axis_config={"include_tip": True, "color": GREY}
        )
        
        # Manually create labels using Text to avoid LaTeX
        x_label = Text("z (Linear Combo)", font_size=20).next_to(ax.x_axis, DOWN)
        y_label = Text("Probability P(y=1)", font_size=20).next_to(ax.y_axis, LEFT).rotate(90 * DEGREES)
        labels = VGroup(x_label, y_label)
        
        self.play(Create(ax), Write(labels))

        # 2. Linear Function vs Sigmoid
        linear_graph = ax.plot(lambda x: 0.2 * x + 0.5, color=GREY, x_range=[-6, 6])
        # Use Text for graph label
        linear_label = Text("Linear?", font_size=20, color=GREY).next_to(ax.c2p(4, 1.3), UP)
        
        self.play(Create(linear_graph), Write(linear_label))
        self.wait(1)
        
        # Explain why linear is bad (unbounded)
        bad_line_part = ax.plot(lambda x: 0.2 * x + 0.5, color=RED, x_range=[3, 6])
        warning = Text("Prob > 1 ??", color=RED, font_size=24).move_to(ax.c2p(5, 1.2))
        
        self.play(Create(bad_line_part), FadeIn(warning))
        self.wait(1)
        
        # 3. Transform to Sigmoid
        sigmoid = ax.plot(lambda x: 1 / (1 + np.exp(-x)), color=BLUE, stroke_width=4)
        sigmoid_label = Text("P(y=1) = 1 / (1 + e^-z)", color=BLUE, font_size=24).move_to(ax.c2p(-4, 0.8))
        
        self.play(
            Transform(linear_graph, sigmoid),
            FadeOut(linear_label),
            FadeOut(bad_line_part),
            FadeOut(warning),
            Write(sigmoid_label)
        )
        self.wait(1)
        
        # 4. Decision Boundary (Threshold = 0.5)
        # Use simple DashedLine if get_horizontal_line fails
        threshold_line = DashedLine(start=ax.c2p(-6, 0.5), end=ax.c2p(6, 0.5), color=YELLOW)
        threshold_idx = Text("Threshold = 0.5", font_size=20, color=YELLOW).next_to(threshold_line, RIGHT)
        
        self.play(Create(threshold_line), Write(threshold_idx))
        
        # Show regions
        pos_region = Rectangle(width=5, height=2.5, color=GREEN, fill_opacity=0.2).move_to(ax.c2p(3, 0.75))
        neg_region = Rectangle(width=5, height=2.5, color=RED, fill_opacity=0.2).move_to(ax.c2p(-3, 0.25))
        
        pos_text = Text("Class 1", color=GREEN).move_to(pos_region)
        neg_text = Text("Class 0", color=RED).move_to(neg_region)
        
        self.play(FadeIn(pos_region), Write(pos_text))
        self.play(FadeIn(neg_region), Write(neg_text))
        
        self.wait(2)
        
        # 5. Cleanup
        self.play(
            FadeOut(ax), FadeOut(labels), FadeOut(sigmoid), FadeOut(sigmoid_label),
            FadeOut(threshold_line), FadeOut(threshold_idx),
            FadeOut(pos_region), FadeOut(pos_text),
            FadeOut(neg_region), FadeOut(neg_text),
            FadeOut(title)
        )
        
        final_text = Text("Logistic Regression\nSquashing Linear Output into Probabilities", font_size=32)
        self.play(Write(final_text))
        self.wait(2)
