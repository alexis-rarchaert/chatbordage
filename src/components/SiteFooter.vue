<template>
  <footer class="site-footer">
    <div class="socials">
      <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" class="dot" aria-label="Discord">
        <!-- Discord Icon -->
        <svg viewBox="0 0 127.14 96.36" width="18" height="18" fill="currentColor">
          <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5A52.22,52.22,0,0,0,31.7,77.58,74.56,74.56,0,0,0,95.44,77.58a52.22,52.22,0,0,0,3.56,2.93,68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.06-18.83C129,54.65,123.5,31.58,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
        </svg>
      </a>
      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="dot" aria-label="Instagram">
        <!-- Instagram Icon -->
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <circle cx="12" cy="12" r="4"></circle>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      </a>
      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" class="dot" aria-label="Facebook">
        <!-- Facebook Icon -->
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
        </svg>
      </a>
    </div>
    <RouterLink to="/mentions-legales">{{ $t('footer.legal') }}</RouterLink>
    <RouterLink to="/cgv">{{ $t('footer.tos') }}</RouterLink>
  </footer>
</template>

<style scoped>
.site-footer {
  background-color: var(--color-burgundy-dark);
  background-image:
    linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.25) 100%),
    url('/bois.png');
  background-size: auto, 400px;
  background-blend-mode: overlay, multiply;
  color: var(--color-gold);
  padding: 40px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  border-top: 3px solid var(--color-gold);
}
.site-footer a {
  color: var(--color-gold);
  text-decoration: underline;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.15s;
}
.site-footer a:hover { color: var(--color-cream); }
.socials {
  display: flex;
  gap: 14px;
  margin-bottom: 8px;
}
.site-footer a.dot {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--color-gold);
  border: 2px solid var(--color-gold-dark);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s, background-color 0.15s, color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-burgundy-dark);
  text-decoration: none;
}
.site-footer a.dot:hover {
  transform: translateY(-2px);
  background: var(--color-cream);
  color: var(--color-burgundy);
}
</style>
