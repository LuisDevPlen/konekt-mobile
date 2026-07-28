export const CUSTOMER_CANCEL_REASONS = [
  { id: 'changed_mind', label: 'Mudei de ideia / pedi por engano' },
  { id: 'wait_too_long', label: 'O tempo de espera está muito longo' },
  { id: 'wrong_address', label: 'Escolhi o endereço ou a forma de entrega errados' },
  { id: 'payment_issue', label: 'Problemas com o pagamento' },
  { id: 'other', label: 'Outro motivo' },
];

export const CUSTOMER_CANCELLABLE_STATUSES = new Set([
  'scheduled',
  'awaiting_prep',
  'pending',
  'confirmed',
  'preparing',
]);

export function canCustomerCancelOrder(order) {
  if (!order) return false;
  if (typeof order === 'string') {
    return CUSTOMER_CANCELLABLE_STATUSES.has(order);
  }
  if (order.cancel_requested_at) return false;
  return Boolean(order.status && CUSTOMER_CANCELLABLE_STATUSES.has(order.status));
}

export function isCustomerCancelReason(reasonId) {
  if (!reasonId) return false;
  return CUSTOMER_CANCEL_REASONS.some((item) => item.id === reasonId);
}

export function customerCancelReasonLabel(reasonId) {
  if (!reasonId) return '';
  return CUSTOMER_CANCEL_REASONS.find((item) => item.id === reasonId)?.label || reasonId;
}

const STORE_SYSTEM_CANCEL_LABELS = {
  not_accepted_in_time: 'A loja não aceitou o pedido em até 5 minutos',
};

export function customerCancelDescription(order) {
  if (!order?.cancel_reason && !order?.cancel_notes) return '';
  const notes = order.cancel_notes?.trim() || '';
  if (order.cancel_reason === 'other') {
    return notes || 'Outro motivo';
  }
  if (STORE_SYSTEM_CANCEL_LABELS[order.cancel_reason]) {
    return STORE_SYSTEM_CANCEL_LABELS[order.cancel_reason];
  }
  const label = customerCancelReasonLabel(order.cancel_reason);
  if (notes) return `${label}. ${notes}`;
  return label;
}

export function hasCustomerCancelRequest(order) {
  return Boolean(order?.cancel_requested_at && order.status !== 'cancelled');
}
