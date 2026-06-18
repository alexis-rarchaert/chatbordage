<template>
  <footer class="site-footer">
    <div class="socials" aria-hidden="true">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
    <a href="#" aria-disabled="true">{{ $t('footer.legal') }}</a>
    <a href="#" aria-disabled="true">{{ $t('footer.tos') }}</a>
  </footer>
</template>

<style scoped>
.site-footer {
  background-color: var(--color-gold-dark);
  background-image:
    linear-gradient(180deg, rgba(168, 133, 47, 0) 0%, rgba(107, 25, 34, 0.15) 100%),
    url('/bois.png');
  background-size: auto, 400px;
  background-blend-mode: overlay, multiply;
  color: var(--color-burgundy-dark);
  padding: 40px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  border-top: 3px solid var(--color-burgundy-dark);
}
.site-footer a {
  color: var(--color-burgundy-dark);
  text-decoration: underline;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.15s;
}
.site-footer a:hover { color: var(--color-ink); }
.socials {
  display: flex;
  gap: 14px;
  margin-bottom: 8px;
}
.dot {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--color-burgundy);
  border: 2px solid var(--color-burgundy-dark);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s;
}
.dot:hover { transform: translateY(-2px); }
</style>
