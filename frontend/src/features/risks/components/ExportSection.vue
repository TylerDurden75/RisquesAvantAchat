<script setup lang="ts">
defineProps<{
  pdfLoading: boolean;
  pdfError: string | null;
  shareCopied: boolean;
  copyShareLink?: () => Promise<boolean>;
}>();

const emit = defineEmits<{ downloadPdf: []; copyShare: [] }>();
</script>

<template>
  <div class="export-section">
    <button type="button" class="btn-pdf" :disabled="pdfLoading" :aria-busy="pdfLoading" @click="emit('downloadPdf')">
      {{ pdfLoading ? "Génération…" : "Télécharger le rapport PDF" }}
    </button>
    <button v-if="copyShareLink" type="button" class="btn-share" :aria-pressed="shareCopied" @click="emit('copyShare')">
      {{ shareCopied ? "Lien copié !" : "Copier le lien" }}
    </button>
    <p v-if="pdfError" class="pdf-error">{{ pdfError }}</p>
  </div>
</template>

<style scoped>
.export-section { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f4f4f5; }
.btn-pdf {
  width: 100%;
  padding: 0.6rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  background: var(--color-primary, #0d9488);
  border: none;
  border-radius: var(--radius-md, 12px);
  cursor: pointer;
}
.btn-pdf:hover:not(:disabled) { background: var(--color-primary-hover, #0f766e); }
.btn-share {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-primary, #0d9488);
  background: rgba(13, 148, 136, 0.1);
  border: 1px solid rgba(13, 148, 136, 0.3);
  border-radius: var(--radius-md, 12px);
  cursor: pointer;
}
.btn-share:hover { background: rgba(13, 148, 136, 0.15); }
.btn-pdf:disabled { opacity: 0.7; cursor: not-allowed; }
.pdf-error { margin-top: 0.5rem; font-size: 0.75rem; color: #b91c1c; }
</style>
