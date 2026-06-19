'use client'

import UiIcon from '@/components/UiIcon'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-secondary"
      style={{
        padding: '8px 18px',
        fontSize: 13,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8
      }}
    >
      <UiIcon name="print" size={16} />
      Print Statement
    </button>
  )
}
