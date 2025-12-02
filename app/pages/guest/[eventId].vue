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

    <div class="flex items-center justify-between">
      <h2 class="text-xl font-medium">
        Gifts
      </h2>
      <UToggle v-model="showOnlyAvailable" on-label="Available only" off-label="All items" />
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
              <span v-else-if="item.status === 'PLANNED'">Planned by {{ item.guestName }}</span>
              <span v-else>Bought by {{ item.guestName }}</span>
            </div>
          </div>
          <div class="flex gap-2 justify-end">
            <UButton
              v-if="item.status === 'AVAILABLE'"
              size="xs"
              color="gray"
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
              color="red"
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

    <UModal v-model="showForm">
      <UCard>
        <template #header>
          <h3 class="text-lg font-medium">
            {{ actionStatus === 'BOUGHT' ? 'Mark as bought' : 'Plan to buy' }}
          </h3>
        </template>
        <UForm :state="formState" @submit="submitAction">
          <div class="space-y-4">
            <p class="text-sm">
              Optional: share your details with the host.
            </p>
            <UFormGroup label="Name" name="name">
              <UInput v-model="formState.name" placeholder="Anonymous Guest" />
            </UFormGroup>
            <UFormGroup label="Email" name="email">
              <UInput v-model="formState.email" type="email" placeholder="(optional)" />
            </UFormGroup>
          </div>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton color="gray" variant="soft" @click="showForm = false">
                Cancel
              </UButton>
              <UButton type="submit" :loading="formLoading">
                Confirm
              </UButton>
            </div>
          </template>
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const toast = useToast()

const { data, refresh, error } = await useFetch(`/api/events/${route.params.eventId}`)

if (error.value) {
  throw createError(error.value)
}

const showOnlyAvailable = ref(true)

const filteredItems = computed(() => {
  if (!data.value) return []
  return data.value.items.filter((item: any) =>
    showOnlyAvailable.value ? item.status === 'AVAILABLE' : true,
  )
})

const showForm = ref(false)
const formLoading = ref(false)
const selectedItem = ref<any | null>(null)
const actionStatus = ref<'PLANNING' | 'BOUGHT'>('PLANNING')

const formState = reactive({
  name: '',
  email: '',
})

function openAction(item: any, status: 'PLANNING' | 'BOUGHT') {
  selectedItem.value = item
  actionStatus.value = status
  Object.assign(formState, { name: '', email: '' })
  showForm.value = true
}

async function submitAction() {
  if (!selectedItem.value) return
  try {
    formLoading.value = true
    await $fetch(`/api/items/${selectedItem.value.id}/claims`, {
      method: 'POST',
      body: {
        status: actionStatus.value === 'PLANNING' ? 'PLANNING' : 'BOUGHT',
        name: formState.name || undefined,
        email: formState.email || undefined,
      },
    })
    showForm.value = false
    await refresh()
  }
  catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || 'Failed to update item', color: 'red' })
  }
  finally {
    formLoading.value = false
  }
}

async function undo(item: any) {
  try {
    await $fetch(`/api/items/${item.id}/claims`, {
      method: 'DELETE',
    })
    await refresh()
  }
  catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || 'Failed to undo', color: 'red' })
  }
}
</script>


