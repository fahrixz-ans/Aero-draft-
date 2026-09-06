import { AppData } from '../../types';

export interface QualityDimensionScore {
  name: string;
  weightPercent: number;
  score: number; // 0 - 100
  applicable: boolean;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'na';
  details: string;
}

export interface AppQualityResult {
  appId: string;
  totalScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  isApkApplicable: boolean;
  dimensions: QualityDimensionScore[];
  recommendations: string[];
}

/**
 * Computes an objective, truthful App Quality Score without fake data or penalties for official link apps.
 */
export function computeAppQualityScore(app: AppData): AppQualityResult {
  const dimensions: QualityDimensionScore[] = [];
  const recommendations: string[] = [];

  // 1. Metadata Completeness (Weight: 20%)
  let metadataPoints = 0;
  if (app.name && app.name.trim().length > 1) metadataPoints += 25;
  if (app.developer && app.developer.trim().length > 1) metadataPoints += 25;
  if (app.icon && app.icon.startsWith('http')) metadataPoints += 25;
  if (app.category && app.category.trim().length > 0) metadataPoints += 15;
  if (app.size && app.size.trim().length > 0) metadataPoints += 10;

  dimensions.push({
    name: 'Kelengkapan Metadata',
    weightPercent: 20,
    score: metadataPoints,
    applicable: true,
    status: metadataPoints >= 90 ? 'excellent' : metadataPoints >= 70 ? 'good' : 'fair',
    details: `${metadataPoints}/100 atribut dasar terisi lengkap.`
  });

  if (metadataPoints < 80) {
    recommendations.push('Lengkapi ikon beresolusi tinggi dan nama developer resmi.');
  }

  // 2. APK Analysis (Weight: 20% if applicable)
  const isHostedApk = app.sourceType === 'apk' || (!app.sourceType && !!app.downloadUrl && !app.officialDownloadUrl);
  let apkScore = 0;
  let isApkApplicable = false;

  if (isHostedApk) {
    isApkApplicable = true;
    if (app.apkFileUrl || app.downloadUrl) apkScore += 40;
    if (app.sha256 || app.signingCertificate?.sha256) apkScore += 30;
    if (app.architectures && app.architectures.length > 0) apkScore += 15;
    if (app.minSdk !== undefined && app.minSdk !== null) apkScore += 15;

    dimensions.push({
      name: 'Analisis Berkas APK',
      weightPercent: 20,
      score: apkScore,
      applicable: true,
      status: apkScore >= 80 ? 'excellent' : apkScore >= 50 ? 'good' : 'poor',
      details: `Integritas biner APK & verifikasi hash SHA-256 (${apkScore}%).`
    });

    if (apkScore < 70) {
      recommendations.push('Sertakan checksum SHA-256 dan arsitektur CPU yang didukung.');
    }
  } else {
    // Official link: APK analysis is NOT applicable
    isApkApplicable = false;
    dimensions.push({
      name: 'Analisis Berkas APK',
      weightPercent: 0,
      score: 100,
      applicable: false,
      status: 'na',
      details: 'Tidak Berlaku (Aplikasi ditautkan ke situs/distributor resmi).'
    });
  }

  // 3. Screenshots (Weight: 15%)
  const screenshotCount = app.screenshots ? app.screenshots.length : 0;
  let screenshotScore = 0;
  if (screenshotCount >= 4) screenshotScore = 100;
  else if (screenshotCount === 3) screenshotScore = 85;
  else if (screenshotCount === 2) screenshotScore = 65;
  else if (screenshotCount === 1) screenshotScore = 40;
  else screenshotScore = 0;

  dimensions.push({
    name: 'Galeri Tangkapan Layar',
    weightPercent: 15,
    score: screenshotScore,
    applicable: true,
    status: screenshotScore >= 80 ? 'excellent' : screenshotScore >= 60 ? 'good' : 'poor',
    details: `${screenshotCount} tangkapan layar antarmuka tersedia.`
  });

  if (screenshotCount < 3) {
    recommendations.push('Tambahkan minimal 3 tangkapan layar untuk kenyamanan pengguna.');
  }

  // 4. Description Quality (Weight: 10%)
  const descLen = app.description ? app.description.trim().length : 0;
  let descScore = 0;
  if (descLen >= 250) descScore = 100;
  else if (descLen >= 150) descScore = 80;
  else if (descLen >= 50) descScore = 50;
  else descScore = 20;

  dimensions.push({
    name: 'Kualitas Deskripsi',
    weightPercent: 10,
    score: descScore,
    applicable: true,
    status: descScore >= 80 ? 'excellent' : descScore >= 50 ? 'good' : 'poor',
    details: `Panjang teks ${descLen} karakter dengan penjelasan fungsionalitas.`
  });

  // 5. Version Information (Weight: 10%)
  let versionScore = 0;
  if (app.version && app.version.trim().length > 0) versionScore += 40;
  if (app.androidVersion && app.androidVersion.trim().length > 0) versionScore += 30;
  if (app.whatsNew && app.whatsNew.trim().length > 10) versionScore += 30;

  dimensions.push({
    name: 'Informasi Versi & Changelog',
    weightPercent: 10,
    score: versionScore,
    applicable: true,
    status: versionScore >= 80 ? 'excellent' : versionScore >= 50 ? 'good' : 'poor',
    details: `Versi ${app.version || '-'}, kompatibilitas ${app.androidVersion || '-'}, catatan rilis.`
  });

  if (!app.whatsNew || app.whatsNew.length <= 10) {
    recommendations.push('Sertakan catatan perubahan (What\'s New) pada rilis terkini.');
  }

  // 6. Security Information (Weight: 15%)
  let securityScore = 0;
  if (app.permissions && app.permissions.length > 0) securityScore += 35;
  if (app.signingCertificate?.sha256 || app.sha256) securityScore += 35;
  if (app.minSdk !== undefined || app.targetSdk !== undefined) securityScore += 30;

  dimensions.push({
    name: 'Informasi Izin & Keamanan',
    weightPercent: 15,
    score: securityScore,
    applicable: true,
    status: securityScore >= 70 ? 'excellent' : securityScore >= 40 ? 'good' : 'fair',
    details: `Transparansi izin Android (${app.permissions?.length || 0} izin) & sertifikat.`
  });

  // 7. Update Consistency (Weight: 10%)
  let updateScore = 0;
  if (app.updatedAt) {
    const daysSinceUpdate = (Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate <= 30) updateScore = 100;
    else if (daysSinceUpdate <= 90) updateScore = 80;
    else if (daysSinceUpdate <= 180) updateScore = 60;
    else updateScore = 40;
  } else {
    updateScore = 30;
  }

  dimensions.push({
    name: 'Konsistensi Pembaruan',
    weightPercent: 10,
    score: updateScore,
    applicable: true,
    status: updateScore >= 80 ? 'excellent' : updateScore >= 60 ? 'good' : 'fair',
    details: `Terakhir diperbarui ${app.updatedAt ? new Date(app.updatedAt).toLocaleDateString('id-ID') : 'tidak tercatat'}.`
  });

  // Final Score Calculation with Proper Normalization (Rule 14: Do not penalize official link apps)
  let totalScore = 0;
  if (isApkApplicable) {
    totalScore = Math.round(
      (metadataPoints * 0.20) +
      (apkScore * 0.20) +
      (screenshotScore * 0.15) +
      (descScore * 0.10) +
      (versionScore * 0.10) +
      (securityScore * 0.15) +
      (updateScore * 0.10)
    );
  } else {
    // Total weights of remaining: 0.20 + 0.15 + 0.10 + 0.10 + 0.15 + 0.10 = 0.80
    // Normalize to 1.0 (divide by 0.80)
    const rawSum = 
      (metadataPoints * 0.20) +
      (screenshotScore * 0.15) +
      (descScore * 0.10) +
      (versionScore * 0.10) +
      (securityScore * 0.15) +
      (updateScore * 0.10);
    totalScore = Math.round(rawSum / 0.80);
  }

  totalScore = Math.min(100, Math.max(0, totalScore));

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'C';
  if (totalScore >= 92) grade = 'A+';
  else if (totalScore >= 80) grade = 'A';
  else if (totalScore >= 68) grade = 'B';
  else if (totalScore >= 50) grade = 'C';
  else grade = 'D';

  return {
    appId: app.id,
    totalScore,
    grade,
    isApkApplicable,
    dimensions,
    recommendations
  };
}
