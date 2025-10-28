export default function AuthLayout({ children }: { children: React.ReactNode }) {
    // bare layout so no sidebar ever appears on /login
    return <>{children}</>;
}
