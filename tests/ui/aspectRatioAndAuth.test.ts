import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('1:1 Aspect Ratio Specification on Mod Station App Detail', () => {
  it('verifies that AppDetailHeader strictly enforces 1:1 square aspect ratio on app icons', () => {
    const filePath = path.resolve(__dirname, '../../src/components/AppDetailHeader.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Must have aspect-square and 1 / 1 on container
    expect(content).toContain("aspect-square");
    expect(content).toContain("style={{ aspectRatio: '1 / 1' }}");
    expect(content).toContain("app-icon-1-1");
    expect(content).toContain("object-cover");
  });

  it('verifies that AppDetailHeader renders cover banner when available without distortion', () => {
    const filePath = path.resolve(__dirname, '../../src/components/AppDetailHeader.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain("app.bannerUrl");
    expect(content).toContain("object-cover");
  });

  it('verifies that ScreenshotGallery preserves native aspect ratios with object-contain', () => {
    const filePath = path.resolve(__dirname, '../../src/components/ScreenshotGallery.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain("object-contain");
    expect(content).toContain("Rasio asli");
  });

  it('verifies that AppDetail recommended & version icons are locked to 1:1 aspect ratio', () => {
    const filePath = path.resolve(__dirname, '../../src/components/AppDetail.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Must contain 1:1 aspect ratio enforcement across shelves
    expect(content).toContain("app-icon-1-1");
    expect(content).toContain("aspectRatio: '1 / 1'");
  });

  it('verifies that AppCard squircle icon container enforces 1:1 aspect ratio', () => {
    const filePath = path.resolve(__dirname, '../../src/components/AppCard.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain("aspect-square");
    expect(content).toContain("aspectRatio: '1 / 1'");
    expect(content).toContain("app-icon-1-1");
  });

  it('verifies that index.css defines .app-icon-1-1 rule with !important', () => {
    const cssPath = path.resolve(__dirname, '../../src/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    expect(cssContent).toContain('.app-icon-1-1');
    expect(cssContent).toContain('aspect-ratio: 1 / 1 !important');
    expect(cssContent).toContain('object-fit: cover !important');
  });
});

describe('Firebase auth/unauthorized-domain Error Handling', () => {
  it('verifies that App.tsx explicitly detects and handles auth/unauthorized-domain', () => {
    const appPath = path.resolve(__dirname, '../../src/App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    expect(appContent).toContain("err?.code === 'auth/unauthorized-domain'");
    expect(appContent).toContain("setShowUnauthorizedDomainModal(true)");
    expect(appContent).toContain("UnauthorizedDomainModal");
  });

  it('verifies that UnauthorizedDomainModal exists and includes diagnostics & copy button', () => {
    const modalPath = path.resolve(__dirname, '../../src/components/auth/UnauthorizedDomainModal.tsx');
    expect(fs.existsSync(modalPath)).toBe(true);

    const modalContent = fs.readFileSync(modalPath, 'utf-8');
    expect(modalContent).toContain("auth/unauthorized-domain");
    expect(modalContent).toContain("Authorized domains");
    expect(modalContent).toContain("Salin Domain");
    expect(modalContent).toContain("console.firebase.google.com");
  });
});
