<script setup lang="ts"></script>

<template>
  <div class="skeleton" aria-hidden="true">
    <div class="skeleton-address" />
    <div class="skeleton-coords">
      <span class="skeleton-bar" />
      <span class="skeleton-bar" />
    </div>
    <div class="skeleton-section">
      <div class="skeleton-score" />
      <div class="skeleton-lines">
        <div class="skeleton-line" />
        <div class="skeleton-line short" />
        <div class="skeleton-line" />
        <div class="skeleton-line short" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton { padding-top: 0.5rem; }
.skeleton-address {
  width: 85%;
  height: 1.25rem;
  background: linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 6px;
  margin-bottom: 0.75rem;
}
.skeleton-coords {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.skeleton-bar {
  width: 5rem;
  height: 0.75rem;
  background: linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
  display: block;
}
.skeleton-section {
  padding-top: 1rem;
  border-top: 1px solid #f4f4f5;
}
.skeleton-score {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  background: linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 50%;
}
.skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.skeleton-line {
  height: 0.875rem;
  background: linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite 0.2s;
  border-radius: 4px;
  width: 100%;
}
.skeleton-line.short { width: 70%; }
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
