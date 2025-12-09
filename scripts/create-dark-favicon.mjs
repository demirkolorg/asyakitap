import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

async function createDarkFavicon() {
    console.log('Creating dark mode favicons...');

    // Invert favicon-32x32
    await sharp(join(publicDir, 'favicon-32x32.png'))
        .negate({ alpha: false })
        .toFile(join(publicDir, 'favicon-32x32-dark.png'));
    console.log('Created: favicon-32x32-dark.png');

    // Invert favicon-16x16
    await sharp(join(publicDir, 'favicon-16x16.png'))
        .negate({ alpha: false })
        .toFile(join(publicDir, 'favicon-16x16-dark.png'));
    console.log('Created: favicon-16x16-dark.png');

    console.log('Dark mode favicons created successfully!');
}

createDarkFavicon().catch(console.error);
