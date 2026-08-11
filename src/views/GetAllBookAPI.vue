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
import authors from '@/assets/json/authors.json'

const loading = ref(false)
const error = ref(null)
const apiResponse = ref(null)

const getAllBooks = async () => {
  loading.value = true
  error.value = null

  try {
    const books = authors.flatMap((author) =>
      author.famousWorks.map((book) => ({
        title: book.title,
        year: book.year,
        author: author.name
      }))
    )

    apiResponse.value = {
      success: true,
      data: {
        totalBooks: books.length,
        books
      },
      timestamp: new Date().toISOString()
    }
  } catch (caughtError) {
    error.value = caughtError.message
  } finally {
    loading.value = false
  }
}

onMounted(getAllBooks)
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

