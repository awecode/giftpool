<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 space-y-10">
    <div class="max-w-xl w-full space-y-6">
      <h1 class="text-3xl font-semibold text-center">
        Giftpool
      </h1>

      <UCard>
        <h2 class="text-xl font-medium mb-4">
          Have a code?
        </h2>
        <p class="text-xs text-gray-500 mb-3">
          Enter the host or guest code to jump straight to an existing event.
        </p>
        <UForm :state="loginState" @submit="onLogin">
          <div class="space-y-4">
            <UFormField label="Access code" name="code" required>
              <UInput v-model="loginState.code" placeholder="Enter host or guest code" />
            </UFormField>
            <UButton :loading="loginLoading" type="submit" block color="neutral" variant="soft">
              Continue
            </UButton>
          </div>
        </UForm>
      </UCard>

      <UCard>
        <h2 class="text-xl font-medium mb-4">
          Create an event
        </h2>
        <p class="text-xs text-gray-500 mb-3">
          Set up a new event wishlist and we’ll email you the host and guest codes to share.
        </p>
        <UForm :state="createState" @submit="onCreateEvent">
          <div class="space-y-4">
            <UFormField label="Event name" name="name" required>
              <UInput v-model="createState.name" placeholder="Jane's Birthday" />
            </UFormField>
            <UFormField label="Event date" name="date" required>
              <UInput v-model="createState.date" type="date" />
            </UFormField>
            <UFormField label="Host email" name="hostEmail" required>
              <UInput v-model="createState.hostEmail" type="email" placeholder="you@example.com" />
            </UFormField>
            <UButton :loading="createLoading" type="submit" block>
              Create event
            </UButton>
          </div>
        </UForm>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const toast = useToast()

const createState = reactive({
  name: '',
  date: '',
  hostEmail: '',
})
const createLoading = ref(false)

const loginState = reactive({
  code: '',
})
const loginLoading = ref(false)

async function onCreateEvent() {
  if (!createState.name || !createState.date || !createState.hostEmail) {
    toast.add({ title: 'Please fill all required fields', color: 'error' })
    return
  }
  try {
    createLoading.value = true
    const res = await $fetch('/api/events', {
      method: 'POST',
      body: {
        name: createState.name,
        date: createState.date,
        hostEmail: createState.hostEmail,
      },
    })
    // @ts-expect-error redirect from API
    await router.push(res.redirect)
  }
  catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.add({ title: err?.data?.statusMessage || 'Failed to create event', color: 'error' })
  }
  finally {
    createLoading.value = false
  }
}

async function onLogin() {
  if (!loginState.code) {
    toast.add({ title: 'Please enter a code', color: 'error' })
    return
  }
  try {
    loginLoading.value = true
    const res = await $fetch('/api/login', {
      method: 'POST',
      body: {
        code: loginState.code,
      },
    })
    // @ts-expect-error redirect from API
    await router.push(res.redirect)
  }
  catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.add({ title: err?.data?.statusMessage || 'Invalid code', color: 'error' })
  }
  finally {
    loginLoading.value = false
  }
}
</script>


