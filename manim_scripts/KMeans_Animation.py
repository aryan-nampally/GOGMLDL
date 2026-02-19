from manim import *
import numpy as np

class KMeansScene(Scene):
    def construct(self):
        # 1. Setup
        title = Text("K-Means Clustering", font_size=36).to_edge(UP)
        self.play(Write(title))

        ax = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 10, 1],
            x_length=6,
            y_length=6,
            axis_config={"include_tip": False, "color": GREY}
        )
        self.play(Create(ax))

        # 2. Data Points (3 clusters)
        np.random.seed(42)
        c1 = np.random.normal([3, 3], 0.8, (10, 2))
        c2 = np.random.normal([7, 8], 0.8, (10, 2))
        c3 = np.random.normal([8, 2], 0.8, (10, 2))
        
        all_points = np.vstack([c1, c2, c3])
        dots = VGroup(*[Dot(ax.c2p(*p), color=WHITE, radius=0.08) for p in all_points])
        
        self.play(FadeIn(dots))
        self.wait(0.5)
        
        # 3. Initialize Centroids (Randomly)
        centroids = np.array([[5, 5], [6, 6], [4, 4]])
        cent_colors = [RED, GREEN, BLUE]
        
        cent_dots = VGroup(*[
            Dot(ax.c2p(*p), color=c, radius=0.15).set_stroke(WHITE, 2) 
            for p, c in zip(centroids, cent_colors)
        ])
        
        self.play(FadeIn(cent_dots))
        self.wait(1)
        
        # 4. Iteration 1: Assignment
        # Color dots based on nearest centroid
        new_dots = VGroup()
        for p in all_points:
            dists = [np.linalg.norm(p - c) for c in centroids]
            closest_idx = np.argmin(dists)
            new_dots.add(Dot(ax.c2p(*p), color=cent_colors[closest_idx], radius=0.08))
            
        self.play(Transform(dots, new_dots))
        self.wait(1)
        
        # 5. Iteration 1: Update Centroids
        # Calculate new means
        new_centroids = []
        for i in range(3):
            points_in_cluster = [p for j, p in enumerate(all_points) if new_dots[j].get_color() == cent_colors[i]]
            if points_in_cluster:
                new_mean = np.mean(points_in_cluster, axis=0)
            else:
                new_mean = centroids[i]
            new_centroids.append(new_mean)
            
        new_cent_dots = VGroup(*[
            Dot(ax.c2p(*p), color=c, radius=0.15).set_stroke(WHITE, 2)
            for p, c in zip(new_centroids, cent_colors)
        ])
        
        # Animate movement
        self.play(Transform(cent_dots, new_cent_dots))
        self.wait(1)
        
        # 6. Iteration 2: Assignment
        # Re-assign based on new centroids
        final_dots = VGroup()
        for p in all_points:
            dists = [np.linalg.norm(p - c) for c in new_centroids]
            closest_idx = np.argmin(dists)
            final_dots.add(Dot(ax.c2p(*p), color=cent_colors[closest_idx], radius=0.08))
            
        self.play(Transform(dots, final_dots))
        self.wait(1)
        
        # 7. Final Step: Voronoi Regions (Approx)
        # Just show final stable state
        final_text = Text("Converged!", font_size=24, color=YELLOW).next_to(ax, DOWN)
        self.play(Write(final_text))
        self.wait(2)
        
        self.play(FadeOut(ax), FadeOut(dots), FadeOut(cent_dots), FadeOut(title), FadeOut(final_text))
        
        end_text = Text("K-Means\nIteratively finding the best centers", font_size=32)
        self.play(Write(end_text))
        self.wait(2)
