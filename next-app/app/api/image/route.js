import { NextResponse } from 'next/server';
import { authProvider } from '@/lib/graphClient';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imagePath = searchParams.get('path'); // e.g. "images/foo.jpg"

  if (!imagePath) {
    return new NextResponse('Missing path parameter', { status: 400 });
  }

  try {
    const accessToken = await authProvider.getAccessToken();

    // Use raw fetch to get file metadata including the CDN download URL
    const encodedPath = imagePath.split('/').map(encodeURIComponent).join('/');
    const metaRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/website/${encodedPath}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      }
    );

    if (!metaRes.ok) {
      console.error('Graph metadata error:', metaRes.status, imagePath);
      return new NextResponse('Image not found', { status: 404 });
    }

    const meta = await metaRes.json();
    const downloadUrl = meta['@microsoft.graph.downloadUrl'];

    if (!downloadUrl) {
      console.error('No downloadUrl for:', imagePath);
      return new NextResponse('No download URL available', { status: 404 });
    }

    // Redirect browser directly to the OneDrive CDN URL - fast and efficient
    return NextResponse.redirect(downloadUrl, { status: 302 });
  } catch (error) {
    console.error('Error fetching image from OneDrive:', error.message);
    return new NextResponse('Image not found', { status: 404 });
  }
}
