<template>
  <div class="min-h-screen p-6 space-y-6">
    <UCard v-if="data">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold">
            {{ data.event.name }}
          </h1>
          <p class="text-sm text-gray-500">
            {{ data.event.date }} • {{ data.event.hostEmail }}
          </p>
        </div>
        <div class="flex flex-col md:flex-row gap-2">
          <UInput :model-value="data.event.hostCode" readonly aria-label="Host code" />
          <UInput :model-value="data.event.guestCode" readonly aria-label="Guest code" />
        </div>
      </div>
    </UCard>

    <div class="flex justify-between items-center">
      <h2 class="text-xl font-medium">
        Items
      </h2>
      <UButton size="sm" @click="openCreate">
        Add item
      </UButton>
    </div>

    <UCard>
      <div v-if="data?.items.length" class="space-y-2">
        <div v-for="item in data.items" :key="item.id" class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b last:border-0 pb-2">
          <div>
            <div class="font-medium">
              {{ item.name }}
            </div>
            <div v-if="item.description" class="text-sm text-gray-500">
              {{ item.description }}
            </div>
            <div v-if="item.link" class="text-sm">
              <NuxtLink :href="item.link" target="_blank" class="text-primary underline">
                View link
              </NuxtLink>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              Status:
              <span v-if="item.status === 'AVAILABLE'">Available</span>
              <span v-else-if="item.status === 'PLANNED'">Planned by {{ item.guestName }}</span>
              <span v-else>Bought by {{ item.guestName }}</span>
            </div>
          </div>
          <div class="flex gap-2 justify-end">
            <UButton size="xs" color="neutral" variant="soft" @click="openEdit(item)">
              Edit
            </UButton>
            <UButton size="xs" color="error" variant="soft" @click="removeItem(item.id)">
              Delete
            </UButton>
          </div>
        </div>
      </div>
      <p v-else class="text-sm text-gray-500">
        No items yet. Add one to get started.
      </p>
    </UCard>

    <USlideover v-model:open="showForm" :title="editingItem ? 'Edit item' : 'Add item'">
      <template #default />

      <template #body>
        <UForm :state="formState" class="space-y-4" @submit="saveItem">
          <UFormField label="Name" name="name" required>
            <UInput v-model="formState.name" />
          </UFormField>
          <UFormField label="Link" name="link">
            <UInput v-model="formState.link" />
          </UFormField>
          <UFormField label="Description" name="description">
            <UTextarea v-model="formState.description" />
          </UFormField>
          <UFormField label="Quantity (display only)" name="quantity">
            <UInput v-model.number="formState.quantity" type="number" min="1" />
          </UFormField>
          <div class="flex justify-end gap-2 pt-4">
            <UButton color="neutral" variant="soft" @click="showForm = false">
              Cancel
            </UButton>
            <UButton type="submit" :loading="formLoading">
              Save
            </UButton>
          </div>
        </UForm>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const toast = useToast()

const { data, refresh, error } = await useFetch(`/api/events/${route.params.eventId}`)

if (error.value) {
  if (error.value.statusCode === 401) {
    toast.add({ title: 'Session expired', color: 'error' })
    await router.push('/')
  }
  else {
    throw createError(error.value)
  }
}

const showForm = ref(false)
const formLoading = ref(false)
interface ItemData {
  id: number
  name: string
  link?: string | null
  description?: string | null
  quantity?: number | null
  status: string
  guestName?: string | null
}

const editingItem = ref<ItemData | null>(null)

const formState = reactive({
  name: '',
  link: '',
  description: '',
  quantity: undefined as number | undefined,
})

function openCreate() {
  editingItem.value = null
  Object.assign(formState, {
    name: '',
    link: '',
    description: '',
    quantity: undefined,
  })
  showForm.value = true
}

function openEdit(item: ItemData) {
  editingItem.value = item
  Object.assign(formState, {
    name: item.name,
    link: item.link,
    description: item.description,
    quantity: item.quantity ?? undefined,
  })
  showForm.value = true
}

async function saveItem() {
  if (!formState.name) {
    toast.add({ title: 'Name is required', color: 'error' })
    return
  }
  try {
    formLoading.value = true
    if (editingItem.value) {
      await $fetch(`/api/items/${editingItem.value.id}`, {
        method: 'PUT',
        body: {
          name: formState.name,
          link: formState.link || undefined,
          description: formState.description || undefined,
          quantity: formState.quantity,
        },
      })
    }
    else {
      await $fetch(`/api/events/${route.params.eventId}/items`, {
        method: 'POST',
        body: {
          name: formState.name,
          link: formState.link || undefined,
          description: formState.description || undefined,
          quantity: formState.quantity,
        },
      })
    }
    showForm.value = false
    await refresh()
  }
  catch (e: unknown) {
    const err = e as { statusCode?: number, data?: { statusMessage?: string } }
    if (err?.statusCode === 401) {
      toast.add({ title: 'Session expired', color: 'error' })
      await router.push('/')
      return
    }
    toast.add({ title: err?.data?.statusMessage || 'Failed to save item', color: 'error' })
  }
  finally {
    formLoading.value = false
  }
}

async function removeItem(id: number) {
  if (!confirm('Delete this item?')) return
  try {
    await $fetch(`/api/items/${id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (e: unknown) {
    const err = e as { statusCode?: number, data?: { statusMessage?: string } }
    if (err?.statusCode === 401) {
      toast.add({ title: 'Session expired', color: 'error' })
      await router.push('/')
      return
    }
    toast.add({ title: err?.data?.statusMessage || 'Failed to delete item', color: 'error' })
  }
}
</script>


