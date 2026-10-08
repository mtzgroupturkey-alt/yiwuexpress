import { redirect } from 'next/navigation'

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  redirect(`/admin/users/${params.id}`)
}
