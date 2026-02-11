import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    // 1. 로그인하지 않은 사용자가 보호된 페이지에 접근할 경우
    if (!session && !request.nextUrl.pathname.startsWith('/auth')) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // 2. 로그인한 사용자의 경우 승인 상태 확인
    if (session) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_approved, is_admin')
            .eq('id', session.user.id)
            .single();

        // 관리자 페이지는 관리자만 접근 가능
        if (request.nextUrl.pathname.startsWith('/admin') && !profile?.is_admin) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // 미승인 사용자는 메인 서비스 이용 불가
        if (!profile?.is_approved && request.nextUrl.pathname !== '/waiting-approval' && !request.nextUrl.pathname.startsWith('/auth')) {
            return NextResponse.redirect(new URL('/waiting-approval', request.url));
        }
    }

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
