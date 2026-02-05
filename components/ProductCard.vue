<script setup lang="ts">
defineProps<{
  name: string
  price: number
  image?: string
}>()
</script>

<template>
  <div class="product-card">
    <div class="product-card__image">
      <img v-if="image" :src="image" :alt="name" />
      <div v-else class="product-card__placeholder">{{ name.charAt(0) }}</div>
    </div>
    <div class="product-card__info">
      <h3 class="product-card__name">{{ name }}</h3>
      <p class="product-card__price">${{ price.toFixed(2) }}</p>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.product-card__image {
  height: 160px;
  background: #f0f0f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-card__placeholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #e0e0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: #6060a0;
}

.product-card__info {
  padding: 14px;
}

.product-card__name {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.product-card__price {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #00b894;
}
</style>
