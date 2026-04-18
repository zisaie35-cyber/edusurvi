'use client'

import dynamic from 'next/dynamic'

const EspaceParent = dynamic(
  () => import('../../components/ParentAccess').then(m => ({ default: m.EspaceParent })),
  { ssr: false }
)

export default function ParentsPage() {
  return <EspaceParent />
}
