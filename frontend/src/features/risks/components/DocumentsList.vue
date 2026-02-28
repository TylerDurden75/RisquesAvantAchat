<script setup lang="ts">
import { computed } from 'vue';
import type { RiskDocument } from '@risquesavantachat/shared-types';

const props = defineProps<{ documents: RiskDocument[] }>();

// Tous les documents ont le même reportUrl (rapport général de la commune)
const reportUrl = computed(() => props.documents[0]?.reportUrl);
</script>

<template>
  <div v-if="documents.length" class="documents-section">
    <div class="documents-header">
      <p class="documents-title">Documents PPR ({{ documents.length }})</p>
      <a
        v-if="reportUrl"
        :href="reportUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="report-link"
        title="Rapport PDF général de la commune (Georisques)"
      >
        Rapport PDF général
      </a>
    </div>
    <ul class="documents-list">
      <li v-for="doc in documents" :key="doc.id" class="document-item">
        <div class="document-info">
          <span class="document-name">{{ doc.name }}</span>
          <span class="document-meta">
            {{ doc.riskType }}{{ doc.approvalDate ? ` · ${doc.approvalDate}` : '' }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.documents-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f4f4f5;
  text-align: left;
}
.documents-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}
.documents-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted, #52525b);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}
.report-link {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  background: rgba(13, 148, 136, 0.12);
  color: var(--color-primary, #0d9488);
  border-radius: 6px;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}
.report-link:hover {
  background: rgba(13, 148, 136, 0.2);
}
.documents-list { list-style: none; margin: 0; padding: 0; max-height: 200px; overflow-y: auto; }
.document-item {
  padding: 0.5rem 0;
  font-size: 0.8125rem;
  border-bottom: 1px solid #f4f4f5;
}
.document-item:last-child { border-bottom: none; }
.document-info { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.document-name { font-weight: 600; color: var(--color-text, #18181b); }
.document-meta { font-size: 0.6875rem; color: var(--color-text-muted, #52525b); }
</style>
