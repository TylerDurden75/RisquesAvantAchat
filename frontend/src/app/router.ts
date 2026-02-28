/**
 * Configuration du routeur Vue.
 *
 * @module app/router
 */

import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './HomePage.vue';
import NotFound from './NotFound.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage, meta: { title: 'RisquesAvantAchat' } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound, meta: { title: 'Page non trouvée' } },
  ],
});

export default router;
