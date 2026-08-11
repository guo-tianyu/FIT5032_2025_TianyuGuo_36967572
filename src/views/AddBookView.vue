<script setup>
import { ref } from 'vue'
import db from '../firebase/init.js'
import { collection, addDoc } from 'firebase/firestore'
import BookList from '../components/BookList.vue'

const isbn = ref('')
const name = ref('')

const addBook = async () => {
  const isbnNumber = Number(isbn.value)
  const bookName = name.value.trim()

  if (!Number.isFinite(isbnNumber) || isbnNumber <= 0) {
    alert('ISBN must be a valid number')
    return
  }

  if (!bookName) {
    alert('Book name is required')
    return
  }

  try {
    const documentReference = await addDoc(collection(db, 'books'), {
      isbn: isbnNumber,
      name: bookName
    })

    console.log('Book added successfully:', documentReference.id)
    alert('Book added successfully!')

    isbn.value = ''
    name.value = ''
  } catch (error) {
    console.error('Error adding book:', error)
    alert('Error adding book')
  }
}
</script>
<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <h1 class="text-center mb-4">Add Book</h1>

        <form @submit.prevent="addBook">
          <div class="mb-3">
            <label for="isbn" class="form-label">ISBN</label>
            <input
              id="isbn"
              v-model="isbn"
              type="text"
              class="form-control"
              placeholder="Enter ISBN"
              required
            />
          </div>

          <div class="mb-3">
            <label for="name" class="form-label">Book Name</label>
            <input
              id="name"
              v-model="name"
              type="text"
              class="form-control"
              placeholder="Enter book name"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary w-100">
            Add Book
          </button>
        </form>

        <hr class="my-4" />
        <BookList />
      </div>
    </div>
  </div>
</template>
