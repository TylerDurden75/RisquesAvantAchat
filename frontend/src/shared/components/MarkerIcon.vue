<script setup lang="ts">
defineProps<{ size?: 'sm' | 'md' | 'lg' }>();
</script>

<template>
  <div class="marker-icon" :class="[size ?? 'md']" aria-hidden="true">
    <div class="marker-pin" />
    <div class="marker-pulse" />
  </div>
</template>

<style scoped>
.marker-icon {
  position: relative;
  width: 30px;
  height: 40px;
  margin: 0 auto;
}
.marker-icon.lg {
  width: 45px;
  height: 60px;
}
.marker-icon.lg .marker-pin {
  margin-left: -18px;
  width: 36px;
  height: 36px;
  border-width: 4px;
}
.marker-icon.lg .marker-pulse {
  margin-left: -18px;
  width: 36px;
  height: 36px;
}
.marker-pin {
  position: absolute;
  bottom: 0;
  left: 50%;
  margin-left: -12px;
  width: 24px;
  height: 24px;
  background: var(--color-primary, #0d9488);
  border: 3px solid white;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);
}
.marker-pulse {
  position: absolute;
  bottom: 2px;
  left: 50%;
  margin-left: -12px;
  width: 24px;
  height: 24px;
  background: rgba(13, 148, 136, 0.25);
  border-radius: 50%;
  animation: marker-pulse 2s ease-out infinite;
}
@keyframes marker-pulse {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}
</style>
