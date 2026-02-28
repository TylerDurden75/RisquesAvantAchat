<script setup lang="ts">
import { computed, provide } from "vue";
import { useSeoMeta } from "@vueuse/head";
import { useSelectedAddress } from "@features/geo";
import { AddressSearch } from "@features/address";
import { GEO_CONTEXT_KEY } from "./geoContext.js";
import { API_CONTEXT_KEY, defaultApiClients } from "./apiContext.js";
import { useRouter } from "vue-router";

const router = useRouter();
provide(API_CONTEXT_KEY, defaultApiClients);
const isHome = computed(() => router.currentRoute.value.path === "/");

const { selectedAddress, mapCenter, selectAddress, copyShareLink } = useSelectedAddress();

provide(GEO_CONTEXT_KEY, {
  selectedAddress,
  mapCenter,
  selectAddress,
  copyShareLink,
});

const pageTitle = computed(() => {
  const label = selectedAddress.value?.properties?.label;
  return label
    ? `Risques immobiliers — ${label} | RisquesAvantAchat`
    : "RisquesAvantAchat — Connaître les risques avant d'acheter";
});

const pageDescription = computed(() => {
  const label = selectedAddress.value?.properties?.label;
  return label
    ? `Analyse des risques (inondation, radon, sismicité, argiles) et prix DVF pour ${label}.`
    : "Analysez les risques immobiliers (inondation, radon, sismicité, argiles) et les prix avant d'acheter.";
});

const ogImage = computed(() => {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}/og-default.svg`;
});

const ogUrl = computed(() => {
  if (typeof window === 'undefined') return undefined;
  return window.location.href;
});

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogImage,
  ogUrl,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
});
</script>

<template>
  <div class="app">
    <a href="#main-content" class="skip-link">Aller au contenu principal</a>
    <router-view v-slot="{ Component }">
      <Suspense>
        <component :is="Component" />
        <template #fallback>
          <div class="router-loading" aria-hidden="true" />
        </template>
      </Suspense>
    </router-view>

    <div v-if="isHome" class="top-bar" role="banner">
      <header class="floating-header">
        <div class="brand">
          <h1 class="logo" id="site-title">RisquesAvantAchat</h1>
          <span class="tagline">Connaître les risques avant d'acheter</span>
        </div>
      </header>
      <div class="floating-search">
        <Suspense>
          <AddressSearch @select="selectAddress" />
          <template #fallback>
            <div class="search-skeleton" aria-hidden="true" />
          </template>
        </Suspense>
      </div>
    </div>
  </div>
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --color-bg: #0a0a0b;
  --color-surface: #ffffff;
  --color-surface-elevated: rgba(255, 255, 255, 0.98);
  --color-text: #18181b;
  --color-text-muted: #52525b;
  --color-primary: #0d9488;
  --color-primary-hover: #0f766e;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-xl: 16px;
  --shadow-float: 0 4px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-float-lg: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.1);
}
body {
  font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}
.app { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.floating-header {
  align-self: flex-start;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-float);
  border: 1px solid rgba(255, 255, 255, 0.8);
}
.brand { display: flex; flex-direction: column; gap: 0.1rem; }
.logo { font-size: 1.125rem; font-weight: 700; letter-spacing: -0.025em; color: var(--color-text); }
.tagline { font-size: 0.75rem; color: var(--color-text-muted); font-weight: 500; }
.floating-search { width: min(560px, 100%); align-self: center; }
.search-skeleton {
  height: 48px;
  background: linear-gradient(90deg, rgba(255,255,255,0.5) 25%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.5) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-xl);
  min-width: 280px;
}
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@media (min-width: 900px) {
  .top-bar { flex-direction: row; align-items: center; justify-content: space-between; padding: 1rem; }
  .floating-header { flex-shrink: 0; }
  .floating-search { flex: 1; max-width: 480px; margin-left: 2rem; align-self: center; }
}
@media (max-width: 640px) {
  .top-bar { padding: 0.75rem 1rem; gap: 0.75rem; }
  .floating-header { padding: 0.5rem 1rem; }
  .logo { font-size: 1rem; }
  .floating-search { width: 100%; }
}

.router-loading {
  position: absolute;
  inset: 0;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}
.router-loading::after {
  content: "";
  width: 48px;
  height: 48px;
  border: 3px solid rgba(13, 148, 136, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: router-spin 0.8s linear infinite;
}
@keyframes router-spin {
  to { transform: rotate(360deg); }
}

.skip-link {
  position: absolute;
  top: -100px;
  left: 1rem;
  padding: 0.75rem 1rem;
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
  border-radius: var(--radius-md);
  z-index: 1000;
  transition: top 0.2s ease;
}
.skip-link:focus {
  top: 1rem;
  outline: 2px solid #fff;
  outline-offset: 2px;
}
</style>
