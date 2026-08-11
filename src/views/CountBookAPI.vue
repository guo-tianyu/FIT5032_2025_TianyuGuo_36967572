<template>
  <div class="container api-page">
    <p v-if="loading">Loading API data...</p>
    <p v-else-if="error" class="text-danger">{{ error }}</p>
    <div v-else-if="apiResponse" class="api-response">
      <pre>{{ JSON.stringify(apiResponse, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import authorsData from '@/assets/json/authors.json'

const authors = ref([])
const loading = ref(false)
const error = ref(null)
const apiResponse = ref(null)

const authorsCount = ref(0)
const totalBooks = ref(0)

const calculateStats = () => {
  authorsCount.value = authors.value.length
  totalBooks.value = authors.value.reduce((total, author) => {
    return total + author.famousWorks.length
  }, 0)
}

const getApiData = async () => {
  loading.value = true
  error.value = null

  try {
    authors.value = authorsData
    calculateStats()

    apiResponse.value = {
      success: true,
      data: {
        authorsCount: authorsCount.value,
        totalBooks: totalBooks.value,
        authors: authors.value.map((author) => ({
          name: author.name,
          bookCount: author.famousWorks.length
        }))
      },
      timestamp: new Date().toISOString()
    }
  } catch (caughtError) {
    error.value = caughtError.message
  } finally {
    loading.value = false
  }
}

onMounted(getApiData)
</script>

<style scoped>
.api-page {
  max-width: 760px;
}

.api-response {
  padding: 18px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #f8f9fa;
}

pre {
  margin: 0;
  overflow-x: auto;
  color: #202124;
  font-size: 0.95rem;
  white-space: pre-wrap;
}
</style>

