from manim import *
import numpy as np

class KNNScene(Scene):
    def construct(self):
        # 1. Setup: Title and Axes
        title = Text("k-Nearest Neighbors (KNN)", font_size=40).to_edge(UP)
        self.play(Write(title))
        
        ax = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 10, 1],
            axis_config={"include_tip": False, "color": GREY},
            x_length=6,
            y_length=6
        )
        self.play(Create(ax))

        # 2. Data Points
        # Class A (Blue)
        class_a_points = [
            [2, 3], [3, 4], [2, 5], [1, 3], [3, 2],
            [4, 4], [2, 2], [1, 5]
        ]
        # Class B (Red)
        class_b_points = [
            [7, 7], [8, 6], [7, 8], [6, 7], [8, 8],
            [9, 6], [7, 6], [8, 7]
        ]
        
        dots_a = VGroup(*[Dot(ax.c2p(*p), color=BLUE, radius=0.12) for p in class_a_points])
        dots_b = VGroup(*[Dot(ax.c2p(*p), color=RED, radius=0.12) for p in class_b_points])
        
        self.play(FadeIn(dots_a), FadeIn(dots_b))
        self.wait(0.5)

        # 3. New Query Point
        query_coords = [5, 5]
        query_dot = Dot(ax.c2p(*query_coords), color=YELLOW, radius=0.15).set_z_index(10)
        query_label = Text("?", font_size=24, color=BLACK).move_to(query_dot.get_center())
        
        self.play(GrowFromCenter(query_dot), Write(query_label))
        self.wait(0.5)
        
        explanation = Text("Classify this new point?", font_size=24).next_to(query_dot, UP*2)
        self.play(Write(explanation))
        self.wait(1)
        self.play(FadeOut(explanation))

        # 4. Find Nearest Neighbors (k=3)
        k = 3
        
        # Calculate distances
        all_points = [(p, BLUE) for p in class_a_points] + [(p, RED) for p in class_b_points]
        distances = []
        for p, color in all_points:
            dist = np.linalg.norm(np.array(p) - np.array(query_coords))
            distances.append((dist, p, color))
            
        distances.sort(key=lambda x: x[0])
        nearest_neighbors = distances[:k]
        
        # Draw lines to neighbors
        lines = VGroup()
        for dist, p, color in nearest_neighbors:
            line = DashedLine(
                start=ax.c2p(*query_coords),
                end=ax.c2p(*p),
                color=color,
                stroke_width=3
            )
            lines.add(line)
            
        k_text = Text(f"Find {k} Nearest Neighbors", font_size=28).to_edge(RIGHT).shift(LEFT)
        self.play(Write(k_text))
        
        self.play(Create(lines))
        self.wait(1)

        # 5. Highlight Neighbors
        neighbor_dots = VGroup()
        for _, p, color in nearest_neighbors:
            neighbor_dots.add(Dot(ax.c2p(*p), color=color, radius=0.15).set_z_index(5))
            
        self.play(Transform(dots_a, dots_a), Transform(dots_b, dots_b), FadeIn(neighbor_dots)) # Just to refresh z-order if needed
        
        # Circle the neighborhood
        max_dist = nearest_neighbors[-1][0]
        # Coordinates for circle are in axis units, need to scale to scene units
        # Or just draw a circle using a point on the perimeter
        
        # We can use a Circle centered at query_dot passing through the furthest neighbor
        furthest_neighbor_pos = ax.c2p(*nearest_neighbors[-1][1])
        radius = np.linalg.norm(furthest_neighbor_pos - query_dot.get_center())
        
        neighborhood_circle = Circle(radius=radius, color=WHITE, stroke_opacity=0.5).move_to(query_dot.get_center())
        self.play(Create(neighborhood_circle))
        self.wait(1)

        # 6. Voting
        votes_a = sum(1 for _, _, c in nearest_neighbors if c == BLUE)
        votes_b = sum(1 for _, _, c in nearest_neighbors if c == RED)
        
        vote_text = Text("Majority Vote:", font_size=24).next_to(k_text, DOWN, aligned_edge=LEFT)
        self.play(Write(vote_text))
        
        vote_counts = VGroup(
            Dot(color=BLUE).scale(0.8), Text(f": {votes_a}", font_size=24),
            Dot(color=RED).scale(0.8), Text(f": {votes_b}", font_size=24)
        ).arrange(RIGHT, buff=0.2).next_to(vote_text, DOWN, aligned_edge=LEFT)
        
        self.play(FadeIn(vote_counts))
        self.wait(1)
        
        winner_color = BLUE if votes_a > votes_b else RED
        winner_text = "Blue Class" if votes_a > votes_b else "Red Class"
        
        result_text = Text(f"Result: {winner_text}", font_size=28, color=winner_color).next_to(vote_counts, DOWN, aligned_edge=LEFT, buff=0.4)
        self.play(Write(result_text))
        
        # Color the query dot
        new_query_dot = Dot(ax.c2p(*query_coords), color=winner_color, radius=0.15).set_z_index(10)
        self.play(Transform(query_dot, new_query_dot), FadeOut(query_label))
        self.play(Indicate(query_dot, scale_factor=1.5))
        
        self.wait(2)
        
        # 7. Cleanup
        self.play(
            FadeOut(lines), FadeOut(neighborhood_circle), 
            FadeOut(k_text), FadeOut(vote_text), FadeOut(vote_counts), FadeOut(result_text)
        )
        
        final_text = Text("k-Nearest Neighbors\nSimple & Effective", font_size=36).move_to(ORIGIN)
        self.play(FadeOut(ax), FadeOut(dots_a), FadeOut(dots_b), FadeOut(query_dot), FadeOut(title), FadeIn(final_text))
        self.wait(2)
