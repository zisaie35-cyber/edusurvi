// app/parents/page.tsx
import dynamic from 'next/dynamic'

const EspaceParent = dynamic(
  () => import('@/components/ParentAccess').then(m => m.EspaceParent),
  { ssr: false }
)

export default function ParentsPage() {
  return <EspaceParent />
}
