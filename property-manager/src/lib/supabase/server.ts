import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createSupabaseServerClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
        async set(name: string, value: string, options: Record<string, any>) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value, ...(options || {}) });
        },
        async remove(name: string, options: Record<string, any>) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value: '', maxAge: 0, ...(options || {}) });
        },
      },
    }
  );
};