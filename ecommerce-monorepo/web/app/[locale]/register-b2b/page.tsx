import { redirect } from 'next/navigation';

export default function RegisterB2BPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale || 'en'}/business/register`);
}
