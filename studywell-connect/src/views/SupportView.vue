<script setup>
import { reactive, ref } from 'vue'
import { STORAGE_KEYS, readStorage, writeStorage } from '@/services/storage'

const categories = ['Understanding OSHC', 'Finding a GP', 'Mental wellbeing', 'Urgent care guidance', 'Other student support']
const submittedRequest = ref(null)
const formData = reactive({ name: '', email: '', category: '', subject: '', description: '', consent: false })
const errors = reactive({ name: '', email: '', category: '', subject: '', description: '', consent: '' })

function clearErrors() {
  Object.keys(errors).forEach((field) => { errors[field] = '' })
}

function validateForm() {
  clearErrors()
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  const name = formData.name.trim()
  const subject = formData.subject.trim()
  const description = formData.description.trim()

  if (name.length < 2) errors.name = 'Enter your name using at least 2 characters.'
  if (!emailPattern.test(formData.email.trim())) errors.email = 'Enter a valid email address, such as name@example.com.'
  if (!formData.category) errors.category = 'Choose the type of support you need.'
  if (subject.length < 5) errors.subject = 'Add a short subject using at least 5 characters.'
  if (description.length < 20) errors.description = 'Tell us a little more using at least 20 characters.'
  if (description.length > 500) errors.description = 'Keep your message to 500 characters or fewer.'
  if (!formData.consent) errors.consent = 'Confirm that we may contact you about this request.'

  return !Object.values(errors).some(Boolean)
}

function submitRequest() {
  if (!validateForm()) return

  const request = {
    id: crypto.randomUUID(),
    userId: null,
    name: formData.name.trim().slice(0, 60),
    email: formData.email.trim().toLowerCase().slice(0, 120),
    category: formData.category,
    subject: formData.subject.trim().slice(0, 80),
    description: formData.description.trim().slice(0, 500),
    status: 'Submitted',
    createdAt: new Date().toISOString()
  }

  const requests = readStorage(STORAGE_KEYS.requests, [])
  const safeRequests = Array.isArray(requests) ? requests : []
  safeRequests.push(request)
  writeStorage(STORAGE_KEYS.requests, safeRequests)
  submittedRequest.value = request
  Object.assign(formData, { name: '', email: '', category: '', subject: '', description: '', consent: false })
  clearErrors()
}
</script>

<template>
  <section class="inner-hero support-hero">
    <div class="container inner-hero-content">
      <p class="eyebrow">Private student support</p>
      <h1>It is okay not to know where to start.</h1>
      <p>Tell us what is getting in the way. A StudyWell support coordinator can help you identify a practical next step.</p>
    </div>
  </section>

  <section class="section-space">
    <div class="container support-layout">
      <aside class="support-intro">
        <p class="eyebrow">Before you send</p>
        <h2>A simple, confidential request.</h2>
        <p>This form is for general navigation and wellbeing support. Do not include medical records, passport details or insurance numbers.</p>
        <div class="support-promise"><span aria-hidden="true">✓</span><div><strong>Clear response</strong><p>We use plain English and explain any service we suggest.</p></div></div>
        <div class="support-promise"><span aria-hidden="true">✓</span><div><strong>Your choice</strong><p>You decide whether to follow a referral or recommendation.</p></div></div>
        <div class="urgent-card"><strong>Need urgent help?</strong><p>Call 000 if someone is in immediate danger. For crisis support, call Lifeline on 13 11 14.</p></div>
      </aside>

      <div>
        <div v-if="submittedRequest" class="success-panel" role="status">
          <span aria-hidden="true">✓</span>
          <div><p class="eyebrow">Request received</p><h2>Thank you, {{ submittedRequest.name }}.</h2><p>Your request <strong>{{ submittedRequest.id.slice(0, 8).toUpperCase() }}</strong> is marked <span class="status-badge status-submitted">Submitted</span>. You can track it from your student dashboard after signing in.</p></div>
        </div>

        <form class="support-form" novalidate @submit.prevent="submitRequest">
          <div class="form-heading"><p class="eyebrow">Support request</p><h2>How can we help?</h2><p>Fields marked * are required.</p></div>
          <div class="row g-3">
            <div class="col-md-6 form-field">
              <label for="support-name">Full name *</label>
              <input id="support-name" v-model="formData.name" type="text" maxlength="60" autocomplete="name" :aria-invalid="Boolean(errors.name)" :aria-describedby="errors.name ? 'support-name-error' : undefined" />
              <small v-if="errors.name" id="support-name-error" class="field-error">{{ errors.name }}</small>
            </div>
            <div class="col-md-6 form-field">
              <label for="support-email">Contact email *</label>
              <input id="support-email" v-model="formData.email" type="email" maxlength="120" autocomplete="email" :aria-invalid="Boolean(errors.email)" :aria-describedby="errors.email ? 'support-email-error' : undefined" />
              <small v-if="errors.email" id="support-email-error" class="field-error">{{ errors.email }}</small>
            </div>
            <div class="col-12 form-field">
              <label for="support-category">Support category *</label>
              <select id="support-category" v-model="formData.category" :aria-invalid="Boolean(errors.category)">
                <option value="" disabled>Select a category</option>
                <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
              </select>
              <small v-if="errors.category" class="field-error">{{ errors.category }}</small>
            </div>
            <div class="col-12 form-field">
              <label for="support-subject">Subject *</label>
              <input id="support-subject" v-model="formData.subject" type="text" maxlength="80" placeholder="For example: I am unsure how to find a GP" :aria-invalid="Boolean(errors.subject)" />
              <small v-if="errors.subject" class="field-error">{{ errors.subject }}</small>
            </div>
            <div class="col-12 form-field">
              <label for="support-description" class="d-flex justify-content-between"><span>What is happening? *</span><span>{{ formData.description.length }}/500</span></label>
              <textarea id="support-description" v-model="formData.description" rows="6" maxlength="500" placeholder="Share only the information needed for us to understand your question." :aria-invalid="Boolean(errors.description)"></textarea>
              <small v-if="errors.description" class="field-error">{{ errors.description }}</small>
            </div>
            <div class="col-12">
              <div class="form-check consent-check">
                <input id="support-consent" v-model="formData.consent" class="form-check-input" type="checkbox" :aria-invalid="Boolean(errors.consent)" />
                <label class="form-check-label" for="support-consent">I agree that StudyWell may contact me about this request. *</label>
              </div>
              <small v-if="errors.consent" class="field-error">{{ errors.consent }}</small>
            </div>
          </div>
          <button class="btn btn-brand btn-lg mt-4" type="submit">Submit support request <span aria-hidden="true">→</span></button>
        </form>
      </div>
    </div>
  </section>
</template>
