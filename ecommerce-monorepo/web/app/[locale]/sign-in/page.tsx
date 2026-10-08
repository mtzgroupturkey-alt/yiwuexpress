import { redirect } from 'next/navigation';

export default function SignInPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale || 'en'}/login`);
}
