<script setup>
import { computed, onMounted, ref } from 'vue'
import db from '../firebase/init.js'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import authors from '@/assets/json/authors.json'

const functionUrl = import.meta.env.VITE_BOOK_COUNT_FUNCTION_URL || ''
const isCounting = ref(false)
const functionResult = ref(null)
const functionError = ref('')
const firestoreBooks = ref([])
const firestoreError = ref('')
const isSelling = ref(false)
const saleResult = ref(null)
const saleError = ref('')

const jsonBooks = computed(() => {
  return authors.flatMap((author) =>
    author.famousWorks.map((work) => ({
      title: work.title,
      year: work.year,
      author: author.name
    }))
  )
})

const totalAskingPrice = computed(() => firestoreBooks.value.length * 2.5)

const countBooksWithCloudFunction = async () => {
  functionError.value = ''
  functionResult.value = null

  if (!functionUrl) {
    functionError.value = 'Add VITE_BOOK_COUNT_FUNCTION_URL to .env after deploying the cloud function.'
    return
  }

  isCounting.value = true

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'countBooks', books: jsonBooks.value })
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Cloud function returned an error.')
    }

    functionResult.value = data
  } catch (error) {
    functionError.value = error.message
  } finally {
    isCounting.value = false
  }
}

const fetchFirestoreBooks = async () => {
  firestoreError.value = ''

  try {
    const booksQuery = query(collection(db, 'books'), orderBy('isbn', 'asc'))
    const snapshot = await getDocs(booksQuery)

    firestoreBooks.value = snapshot.docs.map((bookDoc) => ({
      id: bookDoc.id,
      ...bookDoc.data()
    }))
  } catch (error) {
    firestoreError.value = error.message
  }
}

const sellFirestoreDataset = async () => {
  saleError.value = ''
  saleResult.value = null

  if (!functionUrl) {
    saleError.value = 'Cloud function URL is not configured.'
    return
  }

  if (firestoreBooks.value.length === 0) {
    saleError.value = 'No Firestore book records are available to sell.'
    return
  }

  isSelling.value = true

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'sellFirestoreData',
        source: 'Cloud Firestore / books',
        books: firestoreBooks.value
      })
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'The sales cloud function returned an error.')
    }

    saleResult.value = data
  } catch (error) {
    saleError.value = error.message
  } finally {
    isSelling.value = false
  }
}

onMounted(() => {
  countBooksWithCloudFunction()
  fetchFirestoreBooks()
})
</script>

<template>
  <div class="lab9-page">
    <section class="lab9-header">
      <p class="eyebrow">FIT5032 Assessed Lab 9</p>
      <h1>Cloud Function Book Counter</h1>
      <p>
        This screen calls a deployed cloud function to count books from local JSON, then shows a
        buyer-facing Firestore data sale preview.
      </p>
    </section>

    <section class="lab-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Task 9.1</p>
          <h2>JSON Books Counted By Cloud Function</h2>
        </div>
        <button class="btn btn-primary" type="button" :disabled="isCounting" @click="countBooksWithCloudFunction">
          {{ isCounting ? 'Counting...' : 'Run Count' }}
        </button>
      </div>

      <div class="metric-row">
        <div>
          <span class="metric-value">{{ jsonBooks.length }}</span>
          <span class="metric-label">books sent</span>
        </div>
        <div>
          <span class="metric-value">{{ functionResult?.count ?? '-' }}</span>
          <span class="metric-label">books returned</span>
        </div>
      </div>

      <p v-if="functionUrl" class="endpoint">Endpoint: {{ functionUrl }}</p>
      <p v-else class="alert alert-warning mb-0">
        Cloud function URL is not configured yet. Create <code>.env</code> from
        <code>.env.example</code> and paste your deployed endpoint.
      </p>
      <p v-if="functionResult" class="alert alert-success mb-0">
        Count received from {{ functionResult.platform }}.
        {{ functionResult.message || `Successfully counted ${functionResult.count} books.` }}
        <span v-if="functionResult.countedAt">Completed at {{ functionResult.countedAt }}.</span>
      </p>
      <p v-if="functionError" class="alert alert-danger mb-0">{{ functionError }}</p>

      <div class="table-responsive mt-3">
        <table class="table table-sm align-middle">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Year</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="book in jsonBooks" :key="`${book.title}-${book.year}`">
              <td>{{ book.title }}</td>
              <td>{{ book.author }}</td>
              <td>{{ book.year }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="lab-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Task 9.2</p>
          <h2>Firestore Dataset Sales Preview</h2>
        </div>
        <button
          class="btn btn-success"
          type="button"
          :disabled="isSelling || firestoreBooks.length === 0"
          @click="sellFirestoreDataset"
        >
          {{ isSelling ? 'Processing Sale...' : 'Sell via Cloud Function' }}
        </button>
      </div>

      <div class="metric-row">
        <div>
          <span class="metric-value">{{ firestoreBooks.length }}</span>
          <span class="metric-label">Firestore records</span>
        </div>
        <div>
          <span class="metric-value">${{ totalAskingPrice.toFixed(2) }}</span>
          <span class="metric-label">asking price</span>
        </div>
      </div>

      <p v-if="!saleResult" class="alert alert-info mb-3">
        Ready to send the Firestore <code>books</code> dataset to Alibaba Cloud Function Compute.
      </p>
      <p v-if="firestoreError" class="alert alert-danger">{{ firestoreError }}</p>
      <p v-if="saleError" class="alert alert-danger">{{ saleError }}</p>

      <div v-if="saleResult" class="sale-receipt">
        <div class="receipt-status">✓ DATASET SOLD</div>
        <div>
          <span>Invoice ID</span>
          <strong>{{ saleResult.invoiceId }}</strong>
        </div>
        <div>
          <span>Data source</span>
          <strong>{{ saleResult.source }}</strong>
        </div>
        <div>
          <span>Records sold</span>
          <strong>{{ saleResult.recordCount }}</strong>
        </div>
        <div>
          <span>Total paid</span>
          <strong>{{ saleResult.currency }} ${{ Number(saleResult.totalPrice).toFixed(2) }}</strong>
        </div>
        <div>
          <span>License</span>
          <strong>{{ saleResult.license }}</strong>
        </div>
        <div>
          <span>Processed by</span>
          <strong>{{ saleResult.platform }}</strong>
        </div>
        <p>Completed at {{ saleResult.soldAt }}</p>
      </div>

      <div class="table-responsive">
        <table class="table table-sm align-middle">
          <thead>
            <tr>
              <th>Firestore ID</th>
              <th>Book Name</th>
              <th>ISBN</th>
              <th>License</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="book in firestoreBooks" :key="book.id">
              <td>{{ book.id }}</td>
              <td>{{ book.name }}</td>
              <td>{{ book.isbn }}</td>
              <td>Single-use research dataset</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.lab9-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 16px;
}

.lab9-header {
  margin-bottom: 20px;
}

.lab9-header h1,
.lab-panel h2 {
  color: #1f2937;
  letter-spacing: 0;
}

.lab9-header p {
  max-width: 760px;
  color: #4b5563;
}

.eyebrow {
  margin-bottom: 4px;
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
}

.lab-panel {
  margin-bottom: 20px;
  padding: 20px;
  border: 1px solid #d6dde8;
  border-radius: 8px;
  background: #ffffff;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.metric-row > div {
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}

.metric-value {
  display: block;
  color: #111827;
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1.1;
}

.metric-label {
  color: #64748b;
  font-size: 0.9rem;
}

.endpoint {
  overflow-wrap: anywhere;
  color: #374151;
  font-size: 0.92rem;
}

.sale-receipt {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
  padding: 18px;
  border: 2px solid #15803d;
  border-radius: 10px;
  background: #f0fdf4;
}

.sale-receipt > div:not(.receipt-status) {
  padding: 10px 12px;
  border-radius: 6px;
  background: #ffffff;
}

.sale-receipt span,
.sale-receipt strong {
  display: block;
}

.sale-receipt span {
  color: #64748b;
  font-size: 0.82rem;
}

.sale-receipt strong {
  overflow-wrap: anywhere;
  color: #14532d;
}

.receipt-status,
.sale-receipt > p {
  grid-column: 1 / -1;
}

.receipt-status {
  color: #166534;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.sale-receipt > p {
  margin: 0;
  color: #3f6212;
  font-size: 0.85rem;
}

@media (max-width: 640px) {
  .panel-heading,
  .metric-row {
    grid-template-columns: 1fr;
  }

  .panel-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .sale-receipt {
    grid-template-columns: 1fr;
  }
}
</style>
