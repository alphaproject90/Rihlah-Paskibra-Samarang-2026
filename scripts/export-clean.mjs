import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const OUTPUT_ZIP = path.join(ROOT_DIR, 'rihlah-paskibra-samarang-clean.zip');

// Pola / nama file & direktori yang DILARANG MASUK ke dalam arsip
const EXCLUDE_RULES = [
  // Secrets & Environment Variables
  /^\.env($|\..+)/i,           // .env, .env.local, .env.production, .env.* (kecuali .env.example)
  // Dependencies & Build outputs
  /^node_modules$/i,
  /^dist$/i,
  /^\.vercel$/i,
  /^\.git$/i,
  /^\.system_generated$/i,
  // Cache & Log
  /\.log$/i,
  /\.tsbuildinfo$/i,
  // OS Temporary files
  /^\.DS_Store$/i,
  /^Thumbs\.db$/i,
  // Existing zip files
  /\.zip$/i,
];

function shouldExclude(name) {
  // Selalu izinkan .env.example sebagai referensi aman konfigurasi
  if (name.toLowerCase() === '.env.example') return false;

  return EXCLUDE_RULES.some((rule) => rule.test(name));
}

function getFilesRecursively(dir, base = '') {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldExclude(entry.name)) {
      continue;
    }

    const relPath = base ? path.join(base, entry.name) : entry.name;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, relPath));
    } else if (entry.isFile()) {
      results.push({ relPath, fullPath });
    }
  }

  return results;
}

console.log('🔒 Memulai proses Secure Export (Pengecualian Rahasia & Environment)...');

// Buat direktori staging sementara
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rihlah-export-'));
const files = getFilesRecursively(ROOT_DIR);

console.log(`📦 Menemukan ${files.length} file yang aman untuk diarsipkan.`);

// Verifikasi keamanan: pastikan TIDAK ADA file .env atau secret
const secretsCheck = files.filter(f => /^\.env/i.test(path.basename(f.relPath)) && path.basename(f.relPath) !== '.env.example');
if (secretsCheck.length > 0) {
  console.error('❌ FATAL: Terdeteksi file kredensial:', secretsCheck.map(f => f.relPath));
  fs.rmSync(tempDir, { recursive: true, force: true });
  process.exit(1);
}

// Salin file yang lolos verifikasi ke folder staging
for (const file of files) {
  const destPath = path.join(tempDir, file.relPath);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(file.fullPath, destPath);
}

// Hapus file zip lama jika ada
if (fs.existsSync(OUTPUT_ZIP)) {
  fs.unlinkSync(OUTPUT_ZIP);
}

console.log('🗜️  Mengompresi berkas ke format ZIP...');
try {
  // Gunakan tar bawaan Windows/Linux untuk membuat zip
  execSync(`tar -a -cf "${OUTPUT_ZIP}" *`, { cwd: tempDir, stdio: 'inherit' });
} catch {
  // Fallback ke PowerShell Compress-Archive pada Windows jika tar mengalami kendala
  console.log('ℹ️  Fallback ke PowerShell Compress-Archive...');
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${OUTPUT_ZIP}' -Force"`, { stdio: 'inherit' });
}

// Bersihkan folder staging
fs.rmSync(tempDir, { recursive: true, force: true });

const stat = fs.statSync(OUTPUT_ZIP);
const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);

console.log(`\n✅ BERHASIL! Arsip bersih telah dibuat:`);
console.log(`   📁 File: ${path.basename(OUTPUT_ZIP)}`);
console.log(`   ⚖️  Ukuran: ${sizeMB} MB`);
console.log(`   🛡️  Kredensial (.env, .env.local, .env.production) terverifikasi 100% DIKECUALIKAN.`);
