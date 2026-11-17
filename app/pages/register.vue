<script setup lang="ts">
import { PASSWORD_MIN_LENGTH, registerSchema } from '~~/shared/schemas/auth'
import type { RegisterInput } from '~~/shared/schemas/auth'
import { copy } from '~/content/copy'

const route = useRoute()
const { register } = useAuth()

const state = reactive<RegisterInput>({
  name: '',
  email: '',
  password: ''
})

const submitting = ref(false)
const serverError = ref<string | null>(null)

async function onSubmit(event: { data: RegisterInput }) {
  submitting.value = true
  serverError.value = null

  try {
    await register(event.data)
    await navigateTo(safeRedirect(route.query.redirect))
  } catch (error) {
    serverError.value = apiErrorMessage(error, 'Account creation failed. Please try again.')
  } finally {
    submitting.value = false
  }
}

useSeoMeta({
  title: 'Create account',
  description: copy.auth.registerBody
})
</script>

<template>
  <section class="mx-auto flex max-w-[88rem] justify-center px-6 py-16 lg:px-10 lg:py-24">
    <div class="w-full max-w-md">
      <p class="eyebrow">
        Account
      </p>
      <h1 class="mt-3 text-3xl sm:text-4xl">
        {{ copy.auth.registerTitle }}
      </h1>
      <p class="mt-3 text-sm leading-relaxed text-muted">
        {{ copy.auth.registerBody }}
      </p>

      <UAlert
        v-if="serverError"
        color="error"
        variant="subtle"
        :title="serverError"
        class="mt-6"
      />

      <UForm
        :schema="registerSchema"
        :state="state"
        class="mt-8 space-y-5"
        @submit="onSubmit"
      >
        <UFormField
          label="Name"
          name="name"
        >
          <UInput
            v-model="state.name"
            type="text"
            autocomplete="name"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Email"
          name="email"
        >
          <UInput
            v-model="state.email"
            type="email"
            autocomplete="email"
            inputmode="email"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Password"
          name="password"
          :hint="`At least ${PASSWORD_MIN_LENGTH} characters`"
        >
          <UInput
            v-model="state.password"
            type="password"
            autocomplete="new-password"
            :minlength="PASSWORD_MIN_LENGTH"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          block
          size="lg"
          color="primary"
          :loading="submitting"
        >
          Create account
        </UButton>
      </UForm>

      <p class="mt-6 text-sm text-muted">
        Already have an account?
        <NuxtLink
          to="/login"
          class="text-default underline decoration-[var(--theme-border-strong)] underline-offset-4 transition-colors hover:text-primary"
        >
          Sign in
        </NuxtLink>
      </p>
    </div>
  </section>
</template>
