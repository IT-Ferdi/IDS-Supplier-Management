'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-context';
import { LoginForm } from '@/components/auth/login-form';

function LoginInner() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useSearchParams();
    const next = params.get('next') ?? '/supplier';

    useEffect(() => {
        if (user) router.replace(next);
    }, [user, next, router]);

    return <LoginForm />;
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginInner />
        </Suspense>
    );
}
