<template>
  <div class="reglement-page">
    <header class="header">
      <h1>{{ $t('rulesPage.title') }}</h1>
      <RouterLink to="/" class="btn-retour">{{ $t('rulesPage.back') }}</RouterLink>
    </header>

    <section class="content">
      <h2>{{ $t('rulesPage.rule1Title') }}</h2>
      <p>{{ $t('rulesPage.rule1Text') }}</p>
      
      <!-- Ajoutez vos futures règles ici -->
    </section>
  </div>
</template>

<style scoped>
.reglement-page {
  background-color: #fcf9f2;
  color: #1b2a47;
  min-height: 100vh;
  padding: 2rem;
  font-family: 'Trebuchet MS', sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid #d35400;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
}

.btn-retour {
  background-color: #2c3e50;
  color: white;
  padding: 0.8rem 1.5rem;
  text-decoration: none;
  border-radius: 8px;
  font-weight: bold;
}

.btn-retour:hover {
  background-color: #1a252f;
}

.content {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
</style>