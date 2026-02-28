<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goHome() {
  router.push('/');
}
</script>

<template>
  <main id="main-content" class="not-found" role="main" aria-labelledby="not-found-title">
    <div class="not-found-content">
      <span class="not-found-code">404</span>
      <h1 id="not-found-title" class="not-found-title">Page non trouvée</h1>
      <p class="not-found-hint">L'adresse demandée n'existe pas.</p>
      <button type="button" class="not-found-btn" @click="goHome" autofocus>
        Retour à l'accueil
      </button>
    </div>
  </main>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg, #0a0a0b);
}

.not-found-content {
  text-align: center;
  padding: 2rem;
}

.not-found-code {
  display: block;
  font-size: 4rem;
  font-weight: 800;
  color: var(--color-primary, #0d9488);
  line-height: 1;
  margin-bottom: 1rem;
}

.not-found-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text, #18181b);
  margin-bottom: 0.5rem;
}

.not-found-hint {
  font-size: 0.9375rem;
  color: var(--color-text-muted, #52525b);
  margin-bottom: 1.5rem;
}

.not-found-btn {
  padding: 0.75rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #fff;
  background: var(--color-primary, #0d9488);
  border: none;
  border-radius: var(--radius-md, 12px);
  cursor: pointer;
  transition: background 0.15s ease;
}

.not-found-btn:hover {
  background: var(--color-primary-hover, #0f766e);
}
</style>
