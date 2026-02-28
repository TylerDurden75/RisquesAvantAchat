<script setup lang="ts">
defineProps<{
  availableTypes: string[];
  selectedTypes: string[];
  onToggle: (type: string) => void;
}>();
</script>

<template>
  <fieldset
    v-if="availableTypes.length"
    class="filters-section"
    aria-label="Filtres d'affichage des zones sur la carte"
  >
    <legend class="filters-title">Filtres carte</legend>
    <div class="filters-list">
      <label v-for="type in availableTypes" :key="type" class="filter-item">
        <span class="filter-box">
          <input
            type="checkbox"
            :checked="selectedTypes.includes(type)"
            :aria-label="`Afficher les zones ${type}`"
            @change="onToggle(type)"
          />
        </span>
        <span class="filter-label">{{ type }}</span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.filters-section {
  text-align: left;
  border-radius: 6px;
}
.filters-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted, #52525b);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
  border: none;
  padding: 0;
}
.filters-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}
.filter-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8125rem;
  color: var(--color-text, #18181b);
  cursor: pointer;
}
.filter-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}
.filter-item input {
  accent-color: var(--color-primary, #0d9488);
  margin: 0;
}
.filter-label {
  font-weight: 500;
}
</style>
