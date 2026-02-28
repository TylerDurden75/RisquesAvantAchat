<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ScoreInterpretation } from '@risquesavantachat/shared-types';

const props = defineProps<{
  score: number;
  scoreInterpretation?: ScoreInterpretation;
}>();

const tooltipVisible = ref(false);

const interpretation = computed(() =>
  props.scoreInterpretation ?? getDefaultInterpretation(props.score)
);

function getDefaultInterpretation(score: number): ScoreInterpretation {
  if (score >= 60) return { label: 'À éviter', level: 'critical' };
  if (score >= 35) return { label: 'À surveiller', level: 'high' };
  if (score >= 15) return { label: 'Bien géré', level: 'moderate' };
  return { label: 'Risque faible', level: 'low' };
}
</script>

<template>
  <div
    class="score-block"
    @mouseenter="tooltipVisible = true"
    @mouseleave="tooltipVisible = false"
    @focusin="tooltipVisible = true"
    @focusout="tooltipVisible = false"
  >
    <p class="score-row">
      <span class="score-value">Score : {{ score }}/100</span>
      <span class="score-badge" :data-level="interpretation.level">
        {{ interpretation.label }}
      </span>
      <span
        class="score-info"
        tabindex="0"
        role="button"
        aria-label="Explication du score"
        :aria-expanded="tooltipVisible ? 'true' : 'false'"
      >
        <span class="score-info-icon">ⓘ</span>
      </span>
    </p>
    <span class="score-tooltip" :class="{ 'score-tooltip-visible': tooltipVisible }">
      Indicateur global basé sur Radon, Sismicité, PPR, argiles (Georisques).
      Plus le score est élevé, plus les risques sont importants.
    </span>
  </div>
</template>

<style scoped>
.score-block { position: relative; width: 100%; }
.score-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.score-value { font-size: 0.9375rem; font-weight: 600; color: var(--color-text, #18181b); }
.score-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}
.score-badge[data-level='low'] { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
.score-badge[data-level='moderate'] { background: rgba(245, 158, 11, 0.15); color: #b45309; }
.score-badge[data-level='high'] { background: rgba(239, 68, 68, 0.15); color: #b91c1c; }
.score-badge[data-level='critical'] { background: rgba(127, 29, 29, 0.2); color: #991b1b; }
.score-info { display: inline-flex; cursor: help; }
.score-info-icon { font-size: 0.875rem; color: var(--color-text-muted, #52525b); opacity: 0.8; }
.score-info:hover .score-info-icon,
.score-info:focus .score-info-icon { color: var(--color-primary, #0d9488); }
.score-tooltip {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
  width: min(260px, calc(100% - 1rem));
  padding: 0.6rem 0.75rem;
  font-size: 0.75rem;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  pointer-events: none;
  z-index: 100;
}
.score-tooltip-visible { opacity: 1; visibility: visible; }
</style>
