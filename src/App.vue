<template>
  <!-- RouterView agit comme une fenêtre : elle affichera HomeView ou ReglementView selon l'URL -->
  <RouterView />
</template>

<script setup>
import { watch } from 'vue'
import { RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

// Met à jour le titre de l'onglet dès que la langue change
watch(locale, () => {
  document.title = t('siteTitle')
}, { immediate: true })
</script>


<style>
/* Reset global */
body, html {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff; /* Fond de la page en blanc */
  font-family: sans-serif;
  box-sizing: border-box;
  scroll-behavior: smooth;
}

/* Laisse l'application prendre sa taille naturelle et permet le scroll */
#app {
  width: 100%;
  min-height: 100vh;
  display: block; /* On retire le 'flex' et le 'center' qui bloquaient l'écran */
}
</style>