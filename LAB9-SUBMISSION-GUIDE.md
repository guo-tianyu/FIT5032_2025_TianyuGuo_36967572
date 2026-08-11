# FIT5032 Assessed Lab 9 Guide

## Task 9.1 Cloud Function

1. Open Alibaba Cloud Function Compute.
2. Create an HTTP trigger function using the Node.js runtime.
3. Upload or paste the code from `cloud-functions/book-counter/index.js`.
4. Deploy the function and copy the public HTTP trigger URL.
5. Create `.env` in this project from `.env.example`.
6. Set `VITE_BOOK_COUNT_FUNCTION_URL` to the deployed function URL.
7. Restart the Vite server and open `http://127.0.0.1:5173/lab9`.

## Task 9.2 Firestore Data Sale Demo

1. Add several books on the app's `Add Book` page so Firestore contains records.
2. Open the `Lab 9` page.
3. Use the Firestore dataset sales preview section.
4. Click `Sell Dataset` to show a unique sale outcome with an invoice number.

## Screenshot Checklist

- Alibaba Cloud Function page with your account name visible.
- Function code or deployment page showing the HTTP trigger URL.
- Browser running `http://127.0.0.1:5173/lab9` with the JSON book count returned.
- Visual Studio Code showing `src/views/Lab9View.vue`.
- Browser showing the Firestore dataset sale result after clicking `Sell Dataset`.
- Firestore console showing the `books` collection if your tutor expects database evidence.
