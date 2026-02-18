from manim import *
import numpy as np

# No LaTeX dependency - using Text only

class GradientDescentAnim(Scene):
    """Ball rolling down the cost curve to find the minimum."""
    def construct(self):
        # Title
        title = Text("Gradient Descent", font_size=48, color=BLUE).to_edge(UP)
        subtitle = Text("Finding the minimum by following the slope", font_size=22, color=GRAY).next_to(title, DOWN, buff=0.2)
        self.play(Write(title), FadeIn(subtitle, shift=UP))
        self.wait(0.5)
        self.play(FadeOut(title), FadeOut(subtitle))

        # Axes
        ax = Axes(
            x_range=[-4, 4, 1],
            y_range=[-1, 17, 2],
            axis_config={"include_tip": True, "color": WHITE},
        ).scale(0.75)

        x_label = Text("w (weight)", font_size=18).next_to(ax.x_axis, RIGHT)
        y_label = Text("J (cost)", font_size=18).next_to(ax.y_axis, UP)

        # Cost curve: J(w) = w^2
        curve = ax.plot(lambda x: x**2, color=BLUE_C, x_range=[-4, 4])
        curve_label = Text("J(w) = w²", font_size=18, color=BLUE_C).next_to(ax.c2p(3.5, 12), RIGHT)

        self.play(Create(ax), Write(x_label), Write(y_label))
        self.play(Create(curve), Write(curve_label))
        self.wait(0.3)

        # Ball starts high
        w_val = 3.5
        ball = Dot(point=ax.c2p(w_val, w_val**2), radius=0.12, color=RED, z_index=5)

        self.play(FadeIn(ball, scale=0.5))
        self.wait(0.3)

        # Gradient Descent steps
        lr = 0.15

        traced_path = TracedPath(ball.get_center, stroke_color=ORANGE, stroke_width=3, stroke_opacity=0.6)
        self.add(traced_path)

        for i in range(12):
            grad = 2 * w_val
            new_w = w_val - lr * grad

            # Draw tangent at current point
            tangent_slope = 2 * w_val
            tangent_line = ax.plot(
                lambda x, s=tangent_slope, w=w_val: s * (x - w) + w**2,
                x_range=[w_val - 1, w_val + 1],
                color=YELLOW
            )
            self.play(Create(tangent_line), run_time=0.3)

            # Move ball
            new_point = ax.c2p(new_w, new_w**2)
            self.play(
                ball.animate.move_to(new_point),
                FadeOut(tangent_line),
                run_time=0.5
            )
            w_val = new_w

        # Final
        check = Text("Minimum Found!", font_size=32, color=GREEN).to_edge(DOWN)
        self.play(Write(check))
        self.wait(1.5)


class LinearFitAnim(Scene):
    """A line iteratively adjusting to fit the data points."""
    def construct(self):
        title = Text("Linear Regression: Finding the Best Fit", font_size=36, color=BLUE).to_edge(UP)
        self.play(Write(title))
        self.wait(0.3)
        self.play(FadeOut(title))

        ax = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 10, 1],
            axis_config={"include_tip": True},
        ).scale(0.8)
        x_label = Text("x", font_size=18).next_to(ax.x_axis, RIGHT)
        y_label = Text("y", font_size=18).next_to(ax.y_axis, UP)

        self.play(Create(ax), Write(x_label), Write(y_label))

        # Data points (roughly y = 0.8x + 1)
        data = [(1, 1.8), (2, 2.5), (3, 3.3), (4, 4.0), (5, 4.5), (6, 5.8), (7, 6.2), (8, 7.5), (9, 8.0)]
        dots = VGroup(*[
            Dot(ax.c2p(x, y), radius=0.08, color=BLUE)
            for x, y in data
        ])
        self.play(LaggedStartMap(FadeIn, dots, lag_ratio=0.1))
        self.wait(0.3)

        # Animated line: starts bad, converges to best fit
        slope = ValueTracker(0.2)
        intercept = ValueTracker(8.0)

        regression_line = always_redraw(lambda: ax.plot(
            lambda x: slope.get_value() * x + intercept.get_value(),
            x_range=[0, 10],
            color=RED,
            stroke_width=4
        ))

        eq_label = always_redraw(lambda: Text(
            f"y = {slope.get_value():.2f}x + {intercept.get_value():.2f}",
            font_size=20, color=RED
        ).to_corner(UR))

        self.play(Create(regression_line), Write(eq_label))
        self.wait(0.5)

        # Animate fitting
        self.play(
            slope.animate.set_value(0.82),
            intercept.animate.set_value(0.95),
            run_time=4,
            rate_func=smooth
        )

        # Turn green on success
        final_line = ax.plot(lambda x: 0.82 * x + 0.95, x_range=[0, 10], color=GREEN, stroke_width=4)
        success = Text("Best Fit Found!", font_size=28, color=GREEN).to_edge(DOWN)
        self.play(
            ReplacementTransform(regression_line, final_line),
            Write(success)
        )
        self.wait(1.5)


class RSquaredAnim(Scene):
    """Visualizing R-Squared: Total vs Unexplained Variation."""
    def construct(self):
        title = Text("Understanding R-Squared", font_size=42, color=BLUE).to_edge(UP)
        self.play(Write(title))
        self.wait(0.3)

        # Two side-by-side axes
        ax_left = Axes(x_range=[0, 6, 1], y_range=[0, 6, 1], axis_config={"include_tip": False}).scale(0.45).shift(LEFT * 3.5)
        ax_right = Axes(x_range=[0, 6, 1], y_range=[0, 6, 1], axis_config={"include_tip": False}).scale(0.45).shift(RIGHT * 3.5)

        label_left = Text("Total Variation", font_size=20, color=BLUE).next_to(ax_left, UP)
        label_right = Text("Unexplained Variation", font_size=20, color=RED).next_to(ax_right, UP)

        self.play(Create(ax_left), Create(ax_right), Write(label_left), Write(label_right))

        # Data points
        points = [(1, 1.5), (2, 2.8), (3, 2.5), (4, 4.2), (5, 5.0)]
        mean_y = sum(y for _, y in points) / len(points)

        dots_left = VGroup(*[Dot(ax_left.c2p(x, y), radius=0.06, color=WHITE) for x, y in points])
        dots_right = VGroup(*[Dot(ax_right.c2p(x, y), radius=0.06, color=WHITE) for x, y in points])
        self.play(FadeIn(dots_left), FadeIn(dots_right))

        # Left: Mean line + total variation lines
        mean_line = ax_left.plot(lambda x: mean_y, x_range=[0, 6], color=GRAY, stroke_width=2)
        mean_label = Text("mean", font_size=14, color=GRAY).next_to(ax_left.c2p(5.5, mean_y), RIGHT, buff=0.1)

        total_lines = VGroup()
        total_squares = VGroup()
        for x, y in points:
            line = Line(ax_left.c2p(x, y), ax_left.c2p(x, mean_y), color=BLUE, stroke_width=3)
            total_lines.add(line)
            side = abs(y - mean_y) * 0.45 * 0.5
            sq = Square(side_length=max(side, 0.05), color=BLUE, fill_opacity=0.3, stroke_width=1)
            sq.move_to(ax_left.c2p(x, (y + mean_y) / 2))
            total_squares.add(sq)

        self.play(Create(mean_line), Write(mean_label))
        self.play(LaggedStartMap(Create, total_lines, lag_ratio=0.15))
        self.play(LaggedStartMap(FadeIn, total_squares, lag_ratio=0.15))

        # Right: Best fit line + residual lines
        fit_line = ax_right.plot(lambda x: 0.82 * x + 0.6, x_range=[0, 6], color=GREEN, stroke_width=2)
        fit_label = Text("predicted", font_size=14, color=GREEN).next_to(ax_right.c2p(5.5, 0.82*5+0.6), RIGHT, buff=0.1)

        resid_lines = VGroup()
        resid_squares = VGroup()
        for x, y in points:
            pred = 0.82 * x + 0.6
            line = Line(ax_right.c2p(x, y), ax_right.c2p(x, pred), color=RED, stroke_width=3)
            resid_lines.add(line)
            side = abs(y - pred) * 0.45 * 0.5
            sq = Square(side_length=max(side, 0.05), color=RED, fill_opacity=0.3, stroke_width=1)
            sq.move_to(ax_right.c2p(x, (y + pred) / 2))
            resid_squares.add(sq)

        self.play(Create(fit_line), Write(fit_label))
        self.play(LaggedStartMap(Create, resid_lines, lag_ratio=0.15))
        self.play(LaggedStartMap(FadeIn, resid_squares, lag_ratio=0.15))

        # R² equation using Text instead of MathTex
        eq = Text("R² = 1 - (Red / Blue)", font_size=24, color=YELLOW).to_edge(DOWN)
        self.play(Write(eq))
        self.wait(2)
