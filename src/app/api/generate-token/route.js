import { NextResponse } from 'next/server';
import jsonwebtoken from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET(_request) {
    try {
        // Add timeout to the entire request
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 8000); // 8 second timeout
        });

        const processRequest = async () => {

            const TIPTAP_APP_ID = process.env.NEXT_PUBLIC_TIPTAP_APP_ID;
            // Using the token from your environment as the secret key to sign the new JWT.
            const TIPTAP_SECRET_KEY = process.env.NEXT_PUBLIC_TIPTAP_APP_TOKEN;

            if (!TIPTAP_APP_ID || !TIPTAP_SECRET_KEY) {
                console.error('Tiptap environment variables (NEXT_PUBLIC_TIPTAP_APP_ID or NEXT_PUBLIC_TIPTAP_APP_TOKEN) are not set.');
                return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
            }

            const payload = {
                // The 'aud' claim is the App ID for Tiptap Cloud.
                aud: TIPTAP_APP_ID,
                // The 'sub' claim identifies the user. We'll use their user ID from the auth cookie.
                sub: 'default-user',
            };

            // Sign the JWT with your secret key.
            const jwt = jsonwebtoken.sign(payload, TIPTAP_SECRET_KEY, {
                issuer: 'https://cloud.tiptap.dev',
                expiresIn: '1h', // The token will be valid for 1 hour.
            });

            return NextResponse.json({ token: jwt });
        };

        // Race between the actual request and timeout
        return await Promise.race([processRequest(), timeoutPromise]);

    } catch (error) {
        console.error('Error generating Tiptap token:', error);
        
        if (error.message === 'Request timeout') {
            return NextResponse.json({ 
                error: 'Request timed out. Tiptap Pro features may not be available.' 
            }, { status: 408 });
        }
        
        return NextResponse.json({ 
            error: 'Internal Server Error' 
        }, { status: 500 });
    }
} 