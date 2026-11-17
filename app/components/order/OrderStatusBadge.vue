<script setup lang="ts">
import type { OrderStatus } from '~~/shared/types'
import { orderStatusLabels } from '~~/shared/utils/labels'

defineProps<{
  status: OrderStatus
}>()

const colors: Record<OrderStatus, 'neutral' | 'info' | 'primary' | 'warning' | 'success'> = {
  placed: 'neutral',
  confirmed: 'info',
  packed: 'info',
  shipped: 'primary',
  out_for_delivery: 'warning',
  delivered: 'success'
}
</script>

<template>
  <UBadge
    :color="colors[status]"
    variant="subtle"
    size="sm"
  >
    {{ orderStatusLabels[status] }}
  </UBadge>
</template>
