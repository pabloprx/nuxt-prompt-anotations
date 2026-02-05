<script setup lang="ts">
import { ref } from 'vue'

const products = [
  { name: 'Wireless Headphones', price: 79.99 },
  { name: 'Mechanical Keyboard', price: 149.00 },
  { name: 'USB-C Hub', price: 39.95 },
  { name: 'Webcam HD', price: 59.99 },
  { name: 'Monitor Stand', price: 44.50 },
  { name: 'Mouse Pad XL', price: 19.99 },
]

const errorResult = ref<string | null>(null)

async function triggerError() {
  errorResult.value = null
  try {
    await $fetch('/api/demo', {
      method: 'POST',
      body: { email: 'not-an-email', quantity: -1 },
    })
  } catch (err: any) {
    errorResult.value = err?.data?.message || err?.message || 'Request failed'
  }
}
</script>

<template>
  <div class="page">
    <Header />

    <main class="main">
      <section class="section">
        <h2 class="section__title">Products</h2>
        <div class="products-grid">
          <ProductCard
            v-for="product in products"
            :key="product.name"
            :name="product.name"
            :price="product.price"
          />
        </div>
      </section>

      <section class="section">
        <h2 class="section__title">Network Error Test</h2>
        <p class="section__desc">
          Click below to trigger a POST to <code>/api/demo</code> that returns 422.
          The network tracker will capture the failed request.
        </p>
        <button class="trigger-btn" @click="triggerError">
          Trigger Error
        </button>
        <div v-if="errorResult" class="error-result">
          Error: {{ errorResult }}
        </div>
      </section>
    </main>

    <AgentToolbar />
  </div>
</template>

<style>
/* Global reset */
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f5fa;
  color: #1a1a2e;
}
</style>

<style scoped>
.main {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.section {
  margin-bottom: 40px;
}

.section__title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 16px;
}

.section__desc {
  margin: 0 0 12px;
  color: #555;
  line-height: 1.5;
}

.section__desc code {
  background: #e8e8f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 13px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.trigger-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  background: #e74c3c;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.trigger-btn:hover {
  background: #c0392b;
}

.error-result {
  margin-top: 12px;
  padding: 10px 14px;
  background: #fdecea;
  color: #c0392b;
  border-radius: 6px;
  font-size: 14px;
  border-left: 3px solid #e74c3c;
}
</style>
