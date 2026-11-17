<script setup lang="ts">
import { loginSchema } from '~~/shared/schemas/auth'
import type { LoginInput } from '~~/shared/schemas/auth'
import { copy } from '~/content/copy'

const route = useRoute()
const { login } = useAuth()

const state = reactive<LoginInput>({
  email: '',
  password: ''
})

const submitting = ref(false)
const serverError = ref<string | null>(null)

async function onSubmit(event: { data: LoginInput }) {
  submitting.value = true
  serverError.value = null

  try {
    await login(event.data)
    await navigateTo(safeRedirect(route.query.redirect))
  } catch (error) {
    serverError.value = apiErrorMessage(error, 'Sign in failed. Please try again.')
  } finally {
    submitting.value = false
  }
}

useSeoMeta({
  title: 'Sign in',
  description: copy.auth.loginBody
})
</script>

<template>
  <section class="mx-auto flex max-w-[88rem] justify-center px-6 py-16 lg:px-10 lg:py-24">
    <div class="w-full max-w-md">
      <p class="eyebrow">
        {{ copy.auth.loginEyebrow }}
      </p>
      <h1 class="mt-3 text-3xl sm:text-4xl">
        {{ copy.auth.loginTitle }}
      </h1>
      <p class="mt-3 text-sm leading-relaxed text-muted">
        {{ copy.auth.loginBody }}
      </p>

      <UAlert
        v-if="serverError"
        color="error"
        variant="subtle"
        :title="serverError"
        class="mt-6"
      />

      <UForm
        :schema="loginSchema"
        :state="state"
        class="mt-8 space-y-5"
        @submit="onSubmit"
      >
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
        >
          <UInput
            v-model="state.password"
            type="password"
            autocomplete="current-password"
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
          Sign in
        </UButton>
      </UForm>

      <p class="mt-6 text-sm text-muted">
        New here?
        <NuxtLink
          to="/register"
          class="text-default underline decoration-[var(--theme-border-strong)] underline-offset-4 transition-colors hover:text-primary"
        >
          Create account
        </NuxtLink>
      </p>
    </div>
  </section>
</template>
