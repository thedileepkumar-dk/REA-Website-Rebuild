# Original design and motion

The target is behavioral evidence. The rebuild must look like an independently designed product.

## Choose a direction before laying out screens

Record concise decisions, not an elaborate design ceremony:

- User task, audience and density needs: a trading terminal, a booking flow and a portfolio should not share one stock dashboard template.
- Original visual concept and page composition: reorganize navigation, grouping and primary actions where it helps the task. Preserve workflow semantics and route mapping, not the source's positioning.
- Type roles, spacing scale, palette and contrast; component families for forms, tables, charts, cards, dialogs and status feedback.
- Desktop/mobile information priority, navigation and interaction alternatives. Tables may scroll inside a deliberate wrapper; the document should not overflow accidentally.
- Motion purpose for a few recurring transitions and an explicit reduced-motion treatment.

Reusing a user-mandated brand or general platform conventions is compatible with original composition. Do not reuse the reference's logo, hero arrangement, distinctive cards, illustrations or exact copy as the default. A new palette laid over mirrored markup is insufficient.

Use a light asset footprint. Create original code-native visuals where appropriate. Use image generation or licensed assets when they help the experience and the host supports them; neither is a prerequisite. Avoid adding fake trust marks, unsupported customer counts, copied testimonials or misleading product claims.

## Motion with a job

Prefer state-specific motion to background spectacle:

| Moment | Appropriate treatment | Reduced-motion equivalent |
|---|---|---|
| Initial page | A restrained title/content reveal with short stagger | Content visible immediately |
| Navigation/panel change | Brief opacity/transform transition maintaining context | Immediate switch with preserved focus |
| Filter, calculation, save | Result transition and clear status; do not reset unrelated state | Immediate result plus status |
| Dialog/drawer | Focused entrance/exit, focus trap and restore | Immediate placement with same focus handling |
| Reorder/expand | Animate the affected relationship | Direct change without lost content |
| Async operation | Honest loading feedback until the real result | Text/progress status; no required animation |

Durations around 150–300 ms often suit controls and panels; choose according to the task. Use transform/opacity where practical, avoid layout-thrashing scroll handlers, and keep long lists/charts responsive. Do not introduce perpetual parallax, flashing, distracting ticker motion or arbitrary waits to appear animated. Never delay acceptance of an input for an animation.

Make content visible without JavaScript animation initialization. Lazy sections must settle before screenshots. Under `prefers-reduced-motion: reduce`, remove nonessential movement, smooth scrolling and autoplay while preserving every action and result. Test the actual preference, not only the existence of a CSS rule.

## Review originality and quality

Capture source and redesign at comparable workflow states. Review whether major screen composition, hierarchy, typography/component treatment and visual identity are meaningfully independent. Retain the underlying task's familiar language where usability requires it. Do not force novelty into financial tables, keyboard shortcuts or other established user conventions just to increase pixel difference.

Assess the redesign against its own brief: reading order, contrast, alignment, spacing, chart labels, mobile controls, empty/loading/error states and animation behavior. Check important controls at touch widths and with keyboard focus. A screenshot similarity number, difference percentage or number of CSS animations is not a professional-design score.
