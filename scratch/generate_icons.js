const fs = require('fs');
const path = require('path');

const resDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');

// 1. Create mipmap-anydpi-v26 folder
const anyDpiDir = path.join(resDir, 'mipmap-anydpi-v26');
if (!fs.existsSync(anyDpiDir)) fs.mkdirSync(anyDpiDir, { recursive: true });

const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>`;

fs.writeFileSync(path.join(anyDpiDir, 'ic_launcher.xml'), adaptiveXml);
fs.writeFileSync(path.join(anyDpiDir, 'ic_launcher_round.xml'), adaptiveXml);

// 2. Create background color resource in values
const valuesDir = path.join(resDir, 'values');
if (!fs.existsSync(valuesDir)) fs.mkdirSync(valuesDir, { recursive: true });

const bgXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0f0d14</color>
</resources>`;
fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), bgXml);

// 3. Create drawables
const drawableDir = path.join(resDir, 'drawable');
if (!fs.existsSync(drawableDir)) fs.mkdirSync(drawableDir, { recursive: true });

const iconSrc = path.join(process.cwd(), 'icon-512.png');
fs.copyFileSync(iconSrc, path.join(drawableDir, 'ic_launcher.png'));
fs.copyFileSync(iconSrc, path.join(drawableDir, 'ic_launcher_round.png'));
fs.copyFileSync(iconSrc, path.join(drawableDir, 'ic_launcher_foreground.png'));

// 4. Ensure all mipmap folders have legacy png fallbacks
const mipmapFolders = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
mipmapFolders.forEach(folder => {
  const dir = path.join(resDir, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(iconSrc, path.join(dir, 'ic_launcher.png'));
  fs.copyFileSync(iconSrc, path.join(dir, 'ic_launcher_round.png'));
  fs.copyFileSync(iconSrc, path.join(dir, 'ic_launcher_foreground.png'));
});

console.log('✅ ADAPTIVE ICON (API 26+) & LEGACY MIPMAPS GENERATED WITH 100% SUCCESS!');
