<script setup lang="ts">
import { computed } from 'vue';
import type { RiskCategory } from '@risquesavantachat/shared-types';

const props = defineProps<{
  categories: RiskCategory[];
  /** Exclut la catégorie PPR quand les documents sont listés séparément */
  excludePpr?: boolean;
}>();

const displayedCategories = computed(() =>
  props.excludePpr
    ? props.categories.filter((c) => c.id !== 'ppr')
    : props.categories
);
</script>

<template>
  <ul v-if="displayedCategories.length" class="risks-list">
    <li v-for="cat in displayedCategories" :key="cat.id" class="risk-item">
      <div class="risk-item-main">
        <span class="risk-name">{{ cat.name }}</span>
        <span class="risk-level" :data-level="cat.level">
          {{ cat.description || `Niveau ${cat.level}` }}
        </span>
      </div>
      <p v-if="cat.recommendation" class="risk-recommendation">
        {{ cat.recommendation }}
      </p>
    </li>
  </ul>
</template>

<style scoped>
.risks-list { list-style: none; margin: 0; padding: 0; text-align: left; min-width: 0; }
.risk-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.5rem 0;
  font-size: 0.8125rem;
  border-bottom: 1px solid #f4f4f5;
  min-width: 0;
}
.risk-item:last-of-type { border-bottom: none; }
.risk-item-main { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; min-width: 0; }
.risk-recommendation { font-size: 0.7rem; color: var(--color-primary, #0d9488); line-height: 1.4; margin: 0; overflow-wrap: break-word; word-break: break-word; }
.risk-name { font-weight: 600; color: var(--color-text, #18181b); min-width: 0; overflow-wrap: break-word; word-break: break-word; }
.risk-level { font-size: 0.75rem; color: var(--color-text-muted, #52525b); flex-shrink: 1; min-width: 0; overflow-wrap: break-word; word-break: break-word; text-align: right; }
</style>
