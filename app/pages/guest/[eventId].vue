<template>
  <div class="min-h-screen p-6 space-y-6">
    <UCard v-if="data">
      <h1 class="text-2xl font-semibold">
        {{ data.event.name }}
      </h1>
      <p class="text-sm text-gray-500">
        {{ data.event.date }}
      </p>
    </UCard>

    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-xl font-medium">
          Gifts
        </h2>
        <p class="text-xs text-gray-500 mt-1">
          Choose an item to plan or mark as bought. Your name is only used to let you undo your choice.
        </p>
      </div>
      <!-- <UToggle v-model="showOnlyAvailable" on-label="Available only" off-label="All items" /> -->
    </div>

    <UCard>
      <div v-if="filteredItems.length" class="space-y-2">
        <div v-for="item in filteredItems" :key="item.id" class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b last:border-0 pb-2">
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
              <span v-else-if="item.status === 'PLANNED'">Planned</span>
              <span v-else>Bought</span>
            </div>
          </div>
          <div class="flex gap-2 justify-end">
            <UButton
              v-if="item.status === 'AVAILABLE'"
              size="xs"
              color="neutral"
              variant="soft"
              @click="openAction(item, 'PLANNING')"
            >
              Plan to buy
            </UButton>
            <UButton
              v-if="item.status !== 'BOUGHT'"
              size="xs"
              @click="openAction(item, 'BOUGHT')"
            >
              Mark as bought
            </UButton>
            <UButton
              v-if="item.status !== 'AVAILABLE'"
              size="xs"
              color="error"
              variant="soft"
              @click="undo(item)"
            >
              Undo
            </UButton>
          </div>
        </div>
      </div>
      <p v-else class="text-sm text-gray-500">
        No items yet.
      </p>
    </UCard>

    <UModal
      v-model:open="showForm"
      :title="actionStatus === 'BOUGHT' ? 'Mark as bought' : 'Plan to buy'"
    >
      <template #default />

      <template #body>
        <UForm :state="formState" class="space-y-4" @submit="submitAction">
          <UFormField
            label="Your name"
            name="name"
            required
            help="Only you can use this to undo your choice later."
          >
            <UInput v-model="formState.name" placeholder="Your name" />
          </UFormField>
          <UFormField
            label="Stay anonymous to the host"
            name="anonymous"
            help="If checked, even the host will only see “Anonymous Guest”. Other guests never see your name."
          >
            <UCheckbox v-model="formState.anonymous" label="Hide my name from the host" />
          </UFormField>
          <div class="flex justify-end gap-2 pt-4">
            <UButton color="neutral" variant="soft" @click="showForm = false">
              Cancel
            </UButton>
            <UButton type="submit" :loading="formLoading">
              Confirm
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>
    <UModal
      v-model:open="showUndoForm"
      title="Undo your choice"
    >
      <template #default />

      <template #body>
        <UForm :state="undoState" class="space-y-4" @submit="submitUndo">
          <UFormField
            label="Your name"
            name="undo-name"
            required
            help="Enter the same name you used when you claimed this item so we can verify it's you."
          >
            <UInput v-model="undoState.name" placeholder="Your name" />
          </UFormField>
          <div class="flex justify-end gap-2 pt-4">
            <UButton color="neutral" variant="soft" @click="showUndoForm = false">
              Cancel
            </UButton>
            <UButton type="submit" :loading="formLoading">
              Confirm undo
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>
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

const showOnlyAvailable = ref(false)

interface GuestItem {
  id: number
  name: string
  description?: string | null
  link?: string | null
  status: string
  guestDisplayName?: string | null
}

const filteredItems = computed<GuestItem[]>(() => {
  if (!data.value) return []
  return data.value.items.filter((item: GuestItem) =>
    showOnlyAvailable.value ? item.status === 'AVAILABLE' : true,
  )
})

const showForm = ref(false)
const formLoading = ref(false)
const selectedItem = ref<GuestItem | null>(null)
const actionStatus = ref<'PLANNING' | 'BOUGHT'>('PLANNING')

const formState = reactive({
  name: '',
  anonymous: false,
})

function openAction(item: GuestItem, status: 'PLANNING' | 'BOUGHT') {
  selectedItem.value = item
  actionStatus.value = status
  Object.assign(formState, { name: '', anonymous: false })
  showForm.value = true
}

async function submitAction() {
  if (!selectedItem.value) return
  try {
    if (!formState.name.trim()) {
      toast.add({ title: 'Please enter your name to continue', color: 'error' })
      return
    }
    formLoading.value = true
    await $fetch(`/api/items/${selectedItem.value.id}/claims`, {
      method: 'POST',
      body: {
        status: actionStatus.value === 'PLANNING' ? 'PLANNING' : 'BOUGHT',
        name: formState.name,
        anonymous: formState.anonymous,
      },
    })
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
    toast.add({ title: err?.data?.statusMessage || 'Failed to update item', color: 'error' })
  }
  finally {
    formLoading.value = false
  }
}

const showUndoForm = ref(false)
const undoState = reactive({
  name: '',
})

async function undo(item: GuestItem) {
  selectedItem.value = item
  undoState.name = ''
  showUndoForm.value = true
}

async function submitUndo() {
  if (!selectedItem.value) return
  if (!undoState.name.trim()) {
    toast.add({ title: 'Please enter your name to undo', color: 'error' })
    return
  }
  try {
    formLoading.value = true
    await $fetch(`/api/items/${selectedItem.value.id}/claims`, {
      method: 'DELETE',
      body: {
        name: undoState.name,
      },
    })
    showUndoForm.value = false
    await refresh()
  }
  catch (e: unknown) {
    const err = e as { statusCode?: number, data?: { statusMessage?: string } }
    if (err?.statusCode === 401) {
      toast.add({ title: 'Session expired', color: 'error' })
      await router.push('/')
      return
    }
    if (err?.statusCode === 403) {
      toast.add({ title: err?.data?.statusMessage || 'Name doesn’t match the person who claimed this item', color: 'error' })
      return
    }
    toast.add({ title: err?.data?.statusMessage || 'Failed to undo', color: 'error' })
  }
  finally {
    formLoading.value = false
  }
}
</script>


