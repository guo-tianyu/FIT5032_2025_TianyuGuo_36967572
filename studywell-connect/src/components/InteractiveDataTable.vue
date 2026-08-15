<script setup>
import { computed, reactive, ref, useId, watch } from 'vue'

const props = defineProps({
  caption: { type: String, required: true },
  rows: { type: Array, required: true },
  columns: { type: Array, required: true },
  pageSize: { type: Number, default: 10 },
  emptyMessage: { type: String, default: 'No matching records found.' }
})

const tableId = useId()
const globalSearch = ref('')
const columnFilters = reactive(
  Object.fromEntries(props.columns.filter((column) => column.searchable !== false).map((column) => [column.key, '']))
)
const sortKey = ref('')
const sortDirection = ref('ascending')
const currentPage = ref(1)

const safePageSize = computed(() => Math.min(10, Math.max(1, Number(props.pageSize) || 10)))

function cellValue(row, column) {
  return typeof column.value === 'function' ? column.value(row) : row[column.key]
}

function searchableText(value) {
  return String(value ?? '').trim().toLocaleLowerCase()
}

const filteredRows = computed(() => {
  const globalTerm = searchableText(globalSearch.value)

  return props.rows.filter((row) => {
    const matchesGlobal = !globalTerm || props.columns
      .filter((column) => column.searchable !== false)
      .some((column) => searchableText(cellValue(row, column)).includes(globalTerm))

    const matchesColumns = props.columns
      .filter((column) => column.searchable !== false)
      .every((column) => searchableText(cellValue(row, column)).includes(searchableText(columnFilters[column.key])))

    return matchesGlobal && matchesColumns
  })
})

const sortedRows = computed(() => {
  if (!sortKey.value) return filteredRows.value
  const column = props.columns.find((item) => item.key === sortKey.value)
  if (!column) return filteredRows.value

  return [...filteredRows.value].sort((firstRow, secondRow) => {
    const comparison = String(cellValue(firstRow, column) ?? '').localeCompare(
      String(cellValue(secondRow, column) ?? ''),
      undefined,
      { numeric: true, sensitivity: 'base' }
    )
    return sortDirection.value === 'ascending' ? comparison : -comparison
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / safePageSize.value)))
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * safePageSize.value
  return sortedRows.value.slice(start, start + safePageSize.value)
})
const firstRowNumber = computed(() => sortedRows.value.length ? (currentPage.value - 1) * safePageSize.value + 1 : 0)
const lastRowNumber = computed(() => Math.min(currentPage.value * safePageSize.value, sortedRows.value.length))

function toggleSort(column) {
  if (column.sortable === false) return
  if (sortKey.value === column.key) {
    sortDirection.value = sortDirection.value === 'ascending' ? 'descending' : 'ascending'
  } else {
    sortKey.value = column.key
    sortDirection.value = 'ascending'
  }
}

function ariaSort(column) {
  return sortKey.value === column.key ? sortDirection.value : 'none'
}

watch([globalSearch, columnFilters, () => props.rows.length], () => {
  currentPage.value = 1
}, { deep: true })

watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages
})
</script>

<template>
  <div class="interactive-table">
    <div class="table-toolbar">
      <div class="form-field table-search">
        <label :for="`${tableId}-global-search`">Search all {{ caption.toLowerCase() }}</label>
        <input
          :id="`${tableId}-global-search`"
          v-model="globalSearch"
          type="search"
          placeholder="Search all columns"
        />
      </div>
      <span aria-live="polite">{{ filteredRows.length }} result{{ filteredRows.length === 1 ? '' : 's' }}</span>
    </div>

    <div class="request-table-wrap">
      <table class="request-table">
        <caption class="visually-hidden">{{ caption }}</caption>
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :aria-sort="column.sortable === false ? undefined : ariaSort(column)"
            >
              <button
                v-if="column.sortable !== false"
                class="table-sort-button"
                type="button"
                :aria-label="`Sort by ${column.label}`"
                @click="toggleSort(column)"
              >
                {{ column.label }}
                <span aria-hidden="true">{{ sortKey === column.key ? (sortDirection === 'ascending' ? '▲' : '▼') : '↕' }}</span>
              </button>
              <span v-else>{{ column.label }}</span>
            </th>
          </tr>
          <tr class="column-filter-row">
            <th v-for="column in columns" :key="`${column.key}-filter`">
              <template v-if="column.searchable !== false">
                <label class="visually-hidden" :for="`${tableId}-${column.key}-filter`">Search {{ column.label }}</label>
                <input
                  :id="`${tableId}-${column.key}-filter`"
                  v-model="columnFilters[column.key]"
                  type="search"
                  :placeholder="`Search ${column.label}`"
                />
              </template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in paginatedRows" :key="row.id">
            <td v-for="column in columns" :key="column.key">
              <slot name="cell" :row="row" :column="column" :value="cellValue(row, column)">
                {{ cellValue(row, column) }}
              </slot>
            </td>
          </tr>
          <tr v-if="!paginatedRows.length">
            <td :colspan="columns.length" class="table-empty">{{ emptyMessage }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav class="table-pagination" :aria-label="`${caption} pagination`">
      <span>Showing {{ firstRowNumber }}–{{ lastRowNumber }} of {{ sortedRows.length }}</span>
      <div>
        <button type="button" :disabled="currentPage === 1" @click="currentPage--">Previous</button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button type="button" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
      </div>
    </nav>
  </div>
</template>
