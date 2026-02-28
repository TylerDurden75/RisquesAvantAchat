<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useAddressSearch } from '../composables/useAddressSearch.js';
import type { AddressFeature } from '@risquesavantachat/shared-types';

const emit = defineEmits<{ select: [feature: AddressFeature] }>();

const { query, results, loading, error, onInput, clearResults, retry } = useAddressSearch();

const isOpen = ref(false);
const searchRef = ref<HTMLElement | null>(null);
const activeIndex = ref(-1);

const listboxId = 'address-results-listbox';

watch(results, (r) => {
  isOpen.value = r.length > 0;
  activeIndex.value = -1;
});

function select(feature: AddressFeature) {
  query.value = feature.properties.label;
  clearResults();
  isOpen.value = false;
  activeIndex.value = -1;
  emit('select', feature);
}

function handleClickOutside(e: MouseEvent) {
  const el = e.target as Node;
  if (el && searchRef.value && !searchRef.value.contains(el)) {
    isOpen.value = false;
  }
}

function handleKeydown(e: KeyboardEvent) {
  const list = results.value;
  if (!isOpen.value || list.length === 0) {
    if (e.key === 'Escape') isOpen.value = false;
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, list.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, -1);
  } else if (e.key === 'Enter') {
    const item = activeIndex.value >= 0 ? list[activeIndex.value] : undefined;
    if (item) {
      e.preventDefault();
      select(item);
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    isOpen.value = false;
    activeIndex.value = -1;
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>

<template>
  <div
    ref="searchRef"
    class="address-search"
    role="combobox"
    :aria-expanded="isOpen && results.length > 0"
    :aria-controls="listboxId"
    :aria-activedescendant="activeIndex >= 0 ? 'result-' + activeIndex : undefined"
    aria-label="Recherche d'adresse"
    aria-haspopup="listbox"
  >
    <div class="search-box">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        v-model="query"
        type="text"
        placeholder="Rechercher une adresse en France..."
        autocomplete="off"
        class="search-input"
        aria-label="Saisir une adresse en France"
        aria-autocomplete="list"
        @input="onInput"
        @focus="results.length > 0 && (isOpen = true)"
        @keydown="handleKeydown"
      />
      <div v-if="loading" class="loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
    <div v-if="error" class="error-block" role="alert">
      <p class="error">{{ error }}</p>
      <button type="button" class="error-retry" @click="retry">Réessayer</button>
    </div>
    <ul
      v-if="isOpen && results.length"
      :id="listboxId"
      class="results"
      role="listbox"
      aria-label="Résultats de recherche"
    >
      <li
        v-for="(f, i) in results"
        :key="i"
        :id="`result-${i}`"
        class="result-item"
        role="option"
        :aria-selected="i === activeIndex"
        :class="{ 'result-item--active': i === activeIndex }"
        @click="select(f)"
        @mouseenter="activeIndex = i"
      >
        <svg class="result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span class="result-label">{{ f.properties.label }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.address-search {
  position: relative;
  width: 100%;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 14px;
  padding: 0 1.25rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.25s, transform 0.2s;
}

.search-box:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.06);
}

.search-box:focus-within {
  box-shadow: 0 8px 40px rgba(13, 148, 136, 0.15), 0 4px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.search-icon {
  width: 20px;
  height: 20px;
  color: #94a3b8;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  padding: 1rem 0;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: #0f172a;
  outline: none;
}

.search-input::placeholder {
  color: #94a3b8;
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  background: #0d9488;
  border-radius: 50%;
  animation: dot-pulse 1.2s ease-in-out infinite both;
}

.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-pulse {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.results {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.5rem;
  list-style: none;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.06);
  max-height: 360px;
  overflow-y: auto;
  z-index: 1000;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.15s;
  color: #0f172a;
}

.result-item:hover,
.result-item.result-item--active {
  background: #f8fafc;
}

.result-icon {
  width: 18px;
  height: 18px;
  color: #0d9488;
  flex-shrink: 0;
}

.result-label {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 500;
}

.error-block {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.875rem 1rem;
  background: #fef2f2;
  border-radius: 12px;
  font-size: 0.875rem;
  z-index: 1000;
  border: 1px solid #fecaca;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.error { margin: 0; color: #b91c1c; }
.error-retry {
  align-self: flex-start;
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #b91c1c;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  cursor: pointer;
}
.error-retry:hover { background: #fecaca; }
</style>
