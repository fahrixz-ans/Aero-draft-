import { Router } from 'express';
import { generateRobotsTxt } from '../seo/robots';
import { generateSitemapIndexXml, generateAppsSitemapXml, generateCategoriesSitemapXml, generateCollectionsSitemapXml } from '../seo/sitemap';
import { validateAppSeo, calculateSeoHealthScore } from '../seo/validation';
import { buildSeoReportObject, generateHumanReadableSeoReportText } from '../seo/reports';
import { appsDb } from '../repositories';
import { requireAuth, resolveUserSession } from '../middleware/auth';
import { submitBackgroundJob } from '../events';

export const seoRouter = Router();

// -----------------------------------------------------------------------------
// PUBLIC SEO ENDPOINTS & SITEMAPS
// -----------------------------------------------------------------------------

// Robots.txt
seoRouter.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.send(generateRobotsTxt());
});

// Sitemap Index
seoRouter.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.send(generateSitemapIndexXml());
});

// Sitemap Partition Routes
seoRouter.get('/sitemaps/apps.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  const xml = await generateAppsSitemapXml(appsDb);
  res.send(xml);
});

seoRouter.get('/sitemaps/categories.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.send(generateCategoriesSitemapXml());
});

seoRouter.get('/sitemaps/collections.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  const xml = await generateCollectionsSitemapXml();
  res.send(xml);
});

// -----------------------------------------------------------------------------
// ADMIN SEO INTELLIGENCE & REPORTS
// -----------------------------------------------------------------------------

// Get SEO Health Diagnostic Score
seoRouter.get('/api/admin/seo/health', resolveUserSession, requireAuth, (req, res) => {
  const publishedApps = appsDb.filter(a => a.status === 'PUBLISHED');
  const allIssues = publishedApps.flatMap(a => validateAppSeo(a));
  const score = calculateSeoHealthScore(allIssues, publishedApps.length);
  res.json({
    status: 'success',
    data: score
  });
});

// Get Current SEO Issues Center
seoRouter.get('/api/admin/seo/issues', resolveUserSession, requireAuth, (req, res) => {
  const publishedApps = appsDb.filter(a => a.status === 'PUBLISHED');
  const allIssues = publishedApps.flatMap(a => validateAppSeo(a));
  res.json({
    status: 'success',
    data: allIssues
  });
});

// Get Machine-Readable or Text SEO Report
seoRouter.get('/api/admin/seo/reports', resolveUserSession, requireAuth, (req, res) => {
  const format = req.query.format || 'json';
  const reportType = (req.query.type as any) || 'ON_DEMAND';

  const publishedApps = appsDb.filter(a => a.status === 'PUBLISHED');
  const allIssues = publishedApps.flatMap(a => validateAppSeo(a));
  const health = calculateSeoHealthScore(allIssues, publishedApps.length);

  const reportObj = buildSeoReportObject({
    reportType,
    health: {
      overall: health.overall,
      technical: health.technical,
      indexability: health.indexability,
      discovery: health.discovery
    },
    indexation: {
      indexable: publishedApps.length,
      indexed: publishedApps.length,
      excluded: appsDb.length - publishedApps.length
    },
    issues: {
      critical: allIssues.filter(i => i.severity === 'CRITICAL').length,
      high: allIssues.filter(i => i.severity === 'HIGH').length,
      medium: allIssues.filter(i => i.severity === 'MEDIUM').length,
      low: allIssues.filter(i => i.severity === 'LOW').length
    }
  });

  if (format === 'text') {
    res.header('Content-Type', 'text/plain');
    return res.send(generateHumanReadableSeoReportText(reportObj));
  }

  res.json({
    status: 'success',
    data: reportObj
  });
});

// Trigger Asynchronous SEO Job
seoRouter.post('/api/admin/seo/jobs/trigger', resolveUserSession, requireAuth, async (req, res) => {
  const { jobType, entityType, entityId } = req.body;
  
  if (!jobType) {
    return res.status(400).json({ status: 'error', error: 'jobType is required' });
  }

  const job = await submitBackgroundJob({ type: jobType as any, entityType, entityId });
  res.json({
    status: 'success',
    data: {
      message: `SEO Job ${jobType} submitted successfully`,
      jobId: job.jobId
    }
  });
});
