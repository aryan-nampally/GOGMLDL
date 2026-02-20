from manim import *
import numpy as np

class NeuralNetScene(Scene):
    """
    A cinematic walkthrough of a neural network:
      1. Build network architecture layer-by-layer
      2. Show forward propagation with flowing signals
      3. Visualize loss computation
      4. Show backpropagation with gradient flow
      5. Show weight update and repeat
    """

    def construct(self):
        self.camera.background_color = "#0a0a12"

        # ─── Act 1: Title ───
        title = Text("Neural Networks", font_size=42, color=WHITE, weight=BOLD)
        subtitle = Text("How machines learn to think", font_size=22, color=GREY_B)
        subtitle.next_to(title, DOWN, buff=0.3)
        self.play(Write(title, run_time=1.2))
        self.play(FadeIn(subtitle, shift=UP * 0.2))
        self.wait(1)
        self.play(FadeOut(VGroup(title, subtitle), shift=UP))

        # ─── Act 2: Build the Network ───
        layer_sizes = [3, 4, 4, 2]
        layer_colors = [BLUE_C, TEAL_C, YELLOW_C, RED_C]
        layer_labels = ["Input", "Hidden 1", "Hidden 2", "Output"]

        spacing_x = 2.8
        x_start = -(len(layer_sizes) - 1) * spacing_x / 2

        all_neurons = []
        all_edges = []
        neuron_groups = VGroup()
        edge_groups = VGroup()
        label_group = VGroup()

        for l, size in enumerate(layer_sizes):
            layer_neurons = []
            spacing_y = 1.1
            y_start = -(size - 1) * spacing_y / 2
            x = x_start + l * spacing_x

            for n in range(size):
                y = y_start + n * spacing_y
                neuron = Circle(
                    radius=0.22,
                    stroke_color=layer_colors[l],
                    stroke_width=2.5,
                    fill_color=BLACK,
                    fill_opacity=0.7
                ).move_to([x, y, 0])
                layer_neurons.append(neuron)

            all_neurons.append(layer_neurons)

            lbl = Text(layer_labels[l], font_size=16, color=GREY_B)
            lbl.next_to(VGroup(*layer_neurons), DOWN, buff=0.5)
            label_group.add(lbl)

            neuron_groups.add(VGroup(*layer_neurons))

        # Create edges (weights)
        for l in range(len(layer_sizes) - 1):
            layer_edges = []
            for n1 in all_neurons[l]:
                for n2 in all_neurons[l + 1]:
                    edge = Line(
                        n1.get_center(), n2.get_center(),
                        stroke_color=WHITE,
                        stroke_opacity=0.12,
                        stroke_width=1.2
                    )
                    layer_edges.append(edge)
            all_edges.append(layer_edges)
            edge_groups.add(VGroup(*layer_edges))

        # Animate construction layer by layer
        build_title = Text("Building the Architecture", font_size=24, color=WHITE).to_edge(UP, buff=0.4)
        self.play(FadeIn(build_title))

        for l in range(len(layer_sizes)):
            self.play(
                *[GrowFromCenter(n, run_time=0.5) for n in all_neurons[l]],
                FadeIn(label_group[l], shift=UP * 0.15),
                lag_ratio=0.08
            )
            if l > 0:
                self.play(
                    *[Create(e, run_time=0.3) for e in all_edges[l - 1]],
                    lag_ratio=0.02
                )
        self.wait(0.5)
        self.play(FadeOut(build_title))

        # ─── Act 3: Forward Propagation ───
        fwd_title = Text("Forward Pass — Signal Flows Right →", font_size=22, color=BLUE_C).to_edge(UP, buff=0.4)
        self.play(FadeIn(fwd_title))

        # Light up neurons layer by layer with pulse effect
        for l in range(len(layer_sizes)):
            anims = []
            for neuron in all_neurons[l]:
                glow = neuron.copy().set_stroke(layer_colors[l], width=6, opacity=0.8)\
                    .set_fill(layer_colors[l], opacity=0.35)
                anims.append(Transform(neuron, glow, run_time=0.4))

            # Animate edge highlights going to next layer
            if l < len(layer_sizes) - 1:
                # Create flowing dots along some edges
                flow_dots = VGroup()
                # Pick subset of edges for visual clarity
                edges_subset = all_edges[l][::2]  # every other edge
                for edge in edges_subset:
                    dot = Dot(
                        edge.get_start(),
                        radius=0.05,
                        color=layer_colors[l]
                    ).set_opacity(0.9)
                    flow_dots.add(dot)

                self.play(*anims, lag_ratio=0.06)

                # Animate dots flowing along edges
                flow_anims = []
                for dot, edge in zip(flow_dots, edges_subset):
                    flow_anims.append(MoveAlongPath(dot, edge, run_time=0.6))
                self.play(*flow_anims, lag_ratio=0.02)
                self.play(FadeOut(flow_dots, run_time=0.2))
            else:
                self.play(*anims, lag_ratio=0.06)

        self.wait(0.4)
        self.play(FadeOut(fwd_title))

        # ─── Act 4: Loss Computation ───
        loss_title = Text("Loss — How Wrong Are We?", font_size=22, color=RED_C).to_edge(UP, buff=0.4)
        self.play(FadeIn(loss_title))

        # Show prediction vs target
        pred_label = Text("ŷ = [0.8, 0.3]", font_size=26, color=RED_C)
        target_label = Text("y = [1.0, 0.0]", font_size=26, color=GREEN_C)
        loss_formula = Text(
            "L = ½ Σ(ŷᵢ - yᵢ)² = 0.065",
            font_size=24, color=YELLOW_C
        )

        result_group = VGroup(pred_label, target_label, loss_formula)\
            .arrange(DOWN, buff=0.3).to_edge(DOWN, buff=1)

        self.play(Write(pred_label))
        self.play(Write(target_label))
        self.play(Write(loss_formula))
        self.wait(0.8)

        # ─── Act 5: Backpropagation ───
        self.play(FadeOut(VGroup(loss_title, result_group)))

        back_title = Text("Backpropagation — Gradients Flow Left ←", font_size=22, color=YELLOW_C).to_edge(UP, buff=0.4)
        self.play(FadeIn(back_title))

        # Reverse flow: light up from output to input in red/orange
        gradient_colors = [RED_C, ORANGE, YELLOW_C, GOLD_C]
        for l in range(len(layer_sizes) - 1, -1, -1):
            anims = []
            gc = gradient_colors[min(len(layer_sizes) - 1 - l, len(gradient_colors) - 1)]
            for neuron in all_neurons[l]:
                glow = neuron.copy().set_stroke(gc, width=5, opacity=0.9)\
                    .set_fill(gc, opacity=0.25)
                anims.append(Transform(neuron, glow, run_time=0.35))

            # Reverse flowing dots
            if l > 0:
                flow_dots = VGroup()
                edges_subset = all_edges[l - 1][::3]
                for edge in edges_subset:
                    reversed_edge = Line(edge.get_end(), edge.get_start())
                    dot = Dot(reversed_edge.get_start(), radius=0.05, color=gc)\
                        .set_opacity(0.9)
                    flow_dots.add(dot)

                self.play(*anims, lag_ratio=0.06)

                flow_anims = []
                for dot_i, dot in enumerate(flow_dots):
                    edge = edges_subset[dot_i]
                    reversed_edge = Line(edge.get_end(), edge.get_start())
                    flow_anims.append(MoveAlongPath(dot, reversed_edge, run_time=0.5))
                self.play(*flow_anims, lag_ratio=0.02)
                self.play(FadeOut(flow_dots, run_time=0.15))
            else:
                self.play(*anims, lag_ratio=0.06)

        self.wait(0.3)
        self.play(FadeOut(back_title))

        # ─── Act 6: Weight Update ───
        update_title = Text("Weight Update — Learning!", font_size=22, color=GREEN_C).to_edge(UP, buff=0.4)
        self.play(FadeIn(update_title))

        update_eq = Text(
            "w ← w − η · ∂L/∂w",
            font_size=28, color=GREEN_C
        ).to_edge(DOWN, buff=1.5)
        self.play(Write(update_eq))

        # Pulse all edges to show "weight change"
        edge_anims = []
        for layer_edges in all_edges:
            for edge in layer_edges:
                edge_anims.append(
                    edge.animate.set_stroke(
                        GREEN_C,
                        width=np.random.uniform(0.8, 3.0),
                        opacity=np.random.uniform(0.15, 0.55)
                    )
                )
        self.play(*edge_anims, run_time=1.2)
        self.wait(0.5)

        # Reset edges
        reset_anims = []
        for layer_edges in all_edges:
            for edge in layer_edges:
                reset_anims.append(
                    edge.animate.set_stroke(WHITE, width=1.2, opacity=0.12)
                )
        self.play(*reset_anims, run_time=0.6)
        self.play(FadeOut(VGroup(update_title, update_eq)))

        # ─── Act 7: Training Loop Montage ───
        loop_title = Text("Training = Repeat Until Convergence", font_size=22, color=TEAL_C).to_edge(UP, buff=0.4)
        self.play(FadeIn(loop_title))

        epoch_counter = Text("Epoch: 0", font_size=20, color=GREY_A).to_corner(UR, buff=0.5)
        loss_display = Text("Loss: 0.065", font_size=20, color=RED_C).next_to(epoch_counter, DOWN, buff=0.2)
        self.play(FadeIn(epoch_counter), FadeIn(loss_display))

        losses = [0.065, 0.041, 0.022, 0.011, 0.005]
        for epoch, loss_val in enumerate(losses, 1):
            # Quick forward pass
            for l in range(len(layer_sizes)):
                for neuron in all_neurons[l]:
                    neuron.generate_target()
                    neuron.target.set_stroke(layer_colors[l], width=4, opacity=0.7)\
                        .set_fill(layer_colors[l], opacity=0.2)
                self.play(*[MoveToTarget(n) for n in all_neurons[l]], run_time=0.15)

            # Quick backward pass
            for l in range(len(layer_sizes) - 1, -1, -1):
                gc = gradient_colors[min(len(layer_sizes) - 1 - l, len(gradient_colors) - 1)]
                for neuron in all_neurons[l]:
                    neuron.generate_target()
                    neuron.target.set_stroke(gc, width=3, opacity=0.5)\
                        .set_fill(gc, opacity=0.15)
                self.play(*[MoveToTarget(n) for n in all_neurons[l]], run_time=0.1)

            # Update counters
            new_epoch = Text(f"Epoch: {epoch}", font_size=20, color=GREY_A).move_to(epoch_counter)
            new_loss = Text(f"Loss: {loss_val:.3f}", font_size=20, color=interpolate_color(RED_C, GREEN_C, epoch / len(losses))).move_to(loss_display)
            self.play(
                Transform(epoch_counter, new_epoch),
                Transform(loss_display, new_loss),
                run_time=0.2
            )

        self.wait(0.5)

        # ─── Finale ───
        self.play(FadeOut(VGroup(loop_title, epoch_counter, loss_display)))

        # Reset neurons to calm state
        reset_neuron_anims = []
        for l in range(len(layer_sizes)):
            for neuron in all_neurons[l]:
                neuron.generate_target()
                neuron.target.set_stroke(GREEN_C, width=3, opacity=0.9)\
                    .set_fill(GREEN_C, opacity=0.15)
            reset_neuron_anims.extend([MoveToTarget(n) for n in all_neurons[l]])
        self.play(*reset_neuron_anims, run_time=0.6)

        final_text = Text("The network has learned.", font_size=28, color=GREEN_C)
        final_text.to_edge(UP, buff=0.4)
        self.play(Write(final_text))
        self.wait(1.5)

        # Fade everything out
        self.play(*[FadeOut(mob) for mob in self.mobjects], run_time=1)
