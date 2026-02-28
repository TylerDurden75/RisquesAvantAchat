<script setup lang="ts">
import MarkerIcon from "./MarkerIcon.vue";
</script>

<template>
  <section
    class="empty-state"
    aria-labelledby="empty-title"
    aria-describedby="empty-hint"
  >
    <div class="empty-content">
      <div class="empty-icon">
        <MarkerIcon size="lg" />
      </div>
      <p id="empty-title" class="empty-title">Recherchez une adresse</p>
      <p id="empty-hint" class="empty-hint">
        Saisissez une adresse pour évaluer les risques avant achat
      </p>
    </div>
  </section>
</template>

<style scoped>
.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
}
.empty-content {
  text-align: center;
  padding: 2rem 2.5rem;
  max-width: 380px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.9);
}
.empty-icon {
  margin-bottom: 1rem;
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
.empty-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}
.empty-hint {
  font-size: 0.9375rem;
  color: #475569;
  line-height: 1.55;
  font-weight: 500;
}
</style>
