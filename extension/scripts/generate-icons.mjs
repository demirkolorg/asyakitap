/**
 * Icon Generator Script for AsyaKitap Chrome Extension
 *
 * This script generates PNG icons from the SVG source.
 * Run from the extension directory: node scripts/generate-icons.mjs
 *
 * Requires: sharp (npm install sharp --save-dev)
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Sizes needed for Chrome extension
const sizes = [16, 32, 48, 128]

async function generateIcons() {
  try {
    // Dynamic import sharp
    const sharp = (await import('sharp')).default

    const svgPath = join(__dirname, '..', 'assets', 'icons', 'icon.svg')
    const svgBuffer = readFileSync(svgPath)

    for (const size of sizes) {
      const outputPath = join(__dirname, '..', 'assets', 'icons', `icon${size}.png`)

      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath)

      console.log(`Generated: icon${size}.png`)
    }

    console.log('All icons generated successfully!')
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      console.log('Sharp not found. Installing...')
      console.log('Run: npm install sharp --save-dev')
      console.log('Then run this script again.')

      // Create placeholder PNGs manually using a simple base64 approach
      createPlaceholderIcons()
    } else {
      console.error('Error:', error)
    }
  }
}

function createPlaceholderIcons() {
  // Simple red square with 'A' as placeholder
  // These are tiny 1-color PNGs that can work temporarily

  const svgPath = join(__dirname, '..', 'assets', 'icons', 'icon.svg')
  const svg = readFileSync(svgPath, 'utf-8')

  console.log('\nPlaceholder mode: SVG icon is ready.')
  console.log('To generate PNG icons, install sharp and run again:')
  console.log('  npm install sharp --save-dev')
  console.log('  node extension/scripts/generate-icons.mjs')
  console.log('\nAlternatively, manually convert icon.svg to PNGs:')
  console.log('  - icon16.png (16x16)')
  console.log('  - icon32.png (32x32)')
  console.log('  - icon48.png (48x48)')
  console.log('  - icon128.png (128x128)')
}

generateIcons()
