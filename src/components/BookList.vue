<script setup>
import { ref, onMounted } from 'vue'
import db from '../firebase/init.js'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'

const books = ref([])

const fetchBooks = async () => {
  try {
    const q = query(
      collection(db, 'books'),
      where('isbn', '>', 1000),
      orderBy('isbn', 'asc'),
      limit(3)
    )
    const querySnapshot = await getDocs(q)
    const booksArray = []

    querySnapshot.forEach((doc) => {
      booksArray.push({ id: doc.id, ...doc.data() })
    })

    books.value = booksArray
  } catch (error) {
    console.error('Error fetching books:', error)
  }
}

const updateBook = async (book) => {
  const updatedName = prompt('Enter the updated book name:', book.name)

  if (!updatedName || !updatedName.trim()) {
    return
  }

  try {
    await updateDoc(doc(db, 'books', book.id), {
      name: updatedName.trim()
    })

    alert('Book updated successfully!')
    await fetchBooks()
  } catch (error) {
    console.error('Error updating book:', error)
    alert('Error updating book')
  }
}

const deleteBook = async (book) => {
  const shouldDelete = confirm(`Delete "${book.name}"?`)

  if (!shouldDelete) {
    return
  }

  try {
    await deleteDoc(doc(db, 'books', book.id))

    alert('Book deleted successfully!')
    await fetchBooks()
  } catch (error) {
    console.error('Error deleting book:', error)
    alert('Error deleting book')
  }
}

onMounted(() => {
  fetchBooks()
})
</script>

<template>
  <div class="mt-4">
    <h2 class="h3 text-center mb-3">Books with ISBN &gt; 1000</h2>
    <ul class="list-group">
      <li
        v-for="book in books"
        :key="book.id"
        class="list-group-item d-flex justify-content-between align-items-center gap-3"
      >
        <span>{{ book.name }} - ISBN: {{ book.isbn }}</span>
        <span class="d-flex gap-2">
          <button
            type="button"
            class="btn btn-sm btn-warning"
            @click="updateBook(book)"
          >
            Update
          </button>
          <button
            type="button"
            class="btn btn-sm btn-danger"
            @click="deleteBook(book)"
          >
            Delete
          </button>
        </span>
      </li>
    </ul>
  </div>
</template>
