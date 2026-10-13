import { redirect } from 'next/navigation'

export default function BusinessLoginRedirect({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const query = new URLSearchParams()
  query.set('tab', 'login')

  if (searchParams?.redirect) {
    const redirectVal = Array.isArray(searchParams.redirect)
      ? searchParams.redirect[0]
      : searchParams.redirect
    if (redirectVal) {
      query.set('redirect', redirectVal)
    }
  }

  redirect(`/${params.locale}/register-b2b?${query.toString()}`)
}
