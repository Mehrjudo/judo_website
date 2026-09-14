import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getGraphClient } from '@/lib/graphClient';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type'); // 'news' or 'trainer'

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine upload directory based on type
    const subfolder = type === 'trainers' ? 'trainers' : 'news';
    
    // Original extension
    let ext = file.name ? file.name.substring(file.name.lastIndexOf('.')) : '.jpg';
    if (!ext || ext.length > 5) ext = '.jpg';
    
    const filename = `${uuidv4()}${ext}`;
    
    const client = getGraphClient();
    const endpoint = `/me/drive/root:/website/images/${subfolder}/${filename}:/content`;
    
    // Upload to OneDrive
    await client.api(endpoint).put(buffer);

    // We use our new proxy route for images
    const publicUrl = `/api/image?path=images/${subfolder}/${filename}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
