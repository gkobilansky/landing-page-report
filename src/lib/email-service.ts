import { Resend } from 'resend';

interface AnalysisData {
  id: string;
  url: string;
  overallScore: number;
  grade?: string;
  pageSpeed?: any;
  fonts?: any;
  images?: any;
  cta?: any;
  whitespace?: any;
  socialProof?: any;
  screenshotUrl?: string;
  createdAt: string;
}

interface EmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export async function sendReportEmail(
  email: string,
  analysisData: AnalysisData,
  reportUrl: string
): Promise<EmailResult> {
  try {
    // Validate inputs
    if (!email || !email.trim()) {
      return { success: false, error: 'Email address is required' };
    }

    if (!validateEmail(email.trim())) {
      return { success: false, error: 'Invalid email format' };
    }

    if (!validateUrl(reportUrl)) {
      return { success: false, error: 'Invalid report URL' };
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Generate email content
    const subject = `Your Landing Page Analysis Report is Ready (Score: ${analysisData.overallScore}/100)`;
    const htmlContent = EmailTemplate.generateReportEmail(analysisData, reportUrl);

    // Send email
    const result = await resend.emails.send({
      from: 'reports@lansky.tech',
      to: email.trim(),
      subject,
      html: htmlContent,
      reply_to: 'gene@lansky.tech'
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, emailId: result.data?.id };
  } catch (error) {
    console.error('Email service error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export class EmailTemplate {
  static generateReportEmail(analysisData: AnalysisData, reportUrl: string): string {
    const escapeHtml = (text: string): string => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    const getScoreColor = (score: number): string => {
      if (score >= 90) return '#10B981'; // green-500
      if (score >= 70) return '#F59E0B'; // amber-500
      if (score >= 50) return '#EF4444'; // red-500
      return '#DC2626'; // red-600
    };

    const getGradeEmoji = (score: number): string => {
      if (score >= 90) return '🚀';
      if (score >= 70) return '✨';
      if (score >= 50) return '⚡';
      return '🔧';
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Landing Page Analysis Report</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      color: #374151; 
      background-color: #f9fafb; 
      margin: 0; 
      padding: 0; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff; 
      border-radius: 8px; 
      overflow: hidden; 
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
    }
    .header { 
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%); 
      color: #ffffff; 
      padding: 32px 24px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 24px; 
      font-weight: 700; 
    }
    .header p { 
      margin: 8px 0 0 0; 
      opacity: 0.8; 
      font-size: 16px; 
    }
    .content { 
      padding: 32px 24px; 
    }
    .score-badge { 
      display: inline-block; 
      background-color: ${getScoreColor(analysisData.overallScore)}; 
      color: #ffffff; 
      padding: 12px 24px; 
      border-radius: 24px; 
      font-size: 20px; 
      font-weight: 700; 
      margin: 16px 0; 
    }
    .url-box { 
      background-color: #f3f4f6; 
      border: 1px solid #e5e7eb; 
      border-radius: 8px; 
      padding: 16px; 
      margin: 24px 0; 
      word-break: break-all; 
    }
    .cta-button { 
      display: inline-block; 
      background-color: #FFCC00; 
      color: #1f2937; 
      padding: 16px 32px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 600; 
      font-size: 16px; 
      margin: 24px 0; 
      transition: background-color 0.2s; 
    }
    .cta-button:hover { 
      background-color: #fbbf24; 
    }
    .screenshot { 
      width: 100%; 
      height: auto; 
      border-radius: 8px; 
      margin: 24px 0; 
      border: 1px solid #e5e7eb; 
    }
    .footer { 
      background-color: #f9fafb; 
      padding: 24px; 
      text-align: center; 
      border-top: 1px solid #e5e7eb; 
    }
    .footer p { 
      margin: 0; 
      font-size: 14px; 
      color: #6b7280; 
    }
    .footer a { 
      color: #3b82f6; 
      text-decoration: none; 
    }
    .highlights { 
      background-color: #fef3c7; 
      border: 1px solid #f59e0b; 
      border-radius: 8px; 
      padding: 16px; 
      margin: 24px 0; 
    }
    .highlights h3 { 
      margin: 0 0 12px 0; 
      color: #92400e; 
      font-size: 16px; 
    }
    .highlights ul { 
      margin: 0; 
      padding-left: 20px; 
      color: #92400e; 
    }
    .highlights li { 
      margin: 4px 0; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${getGradeEmoji(analysisData.overallScore)} Your Landing Page Analysis is Ready!</h1>
      <p>Comprehensive analysis with actionable insights</p>
    </div>
    
    <div class="content">
      <div style="text-align: center;">
        <div class="score-badge">
          Overall Score: ${analysisData.overallScore}/100
          ${analysisData.grade ? ` (Grade ${analysisData.grade})` : ''}
        </div>
      </div>
      
      <p>Hi there! 👋</p>
      
      <p>Great news! Your landing page analysis is complete. I've analyzed your page across 6 key conversion criteria and compiled actionable recommendations to help improve your conversion rates.</p>
      
      <div class="url-box">
        <strong>Analyzed Page:</strong> ${escapeHtml(analysisData.url)}
      </div>
      
      ${analysisData.screenshotUrl ? `
        <img src="${escapeHtml(analysisData.screenshotUrl)}" alt="Page Screenshot" class="screenshot">
      ` : ''}
      
      <div class="highlights">
        <h3>🎯 Key Analysis Areas</h3>
        <ul>
          <li><strong>Page Load Speed</strong> - Core Web Vitals and performance metrics</li>
          <li><strong>Font Usage</strong> - Typography consistency and readability</li>
          <li><strong>Image Optimization</strong> - Format, sizing, and accessibility</li>
          <li><strong>Call-to-Action Analysis</strong> - Visibility and effectiveness</li>
          <li><strong>Whitespace Assessment</strong> - Layout density and spacing</li>
          <li><strong>Social Proof Detection</strong> - Trust signals and credibility</li>
        </ul>
      </div>
      
      <div style="text-align: center;">
        <a href="${escapeHtml(reportUrl)}" class="cta-button">
          📊 View Full Report
        </a>
      </div>
      
      <p>Your detailed report includes:</p>
      <ul>
        <li>✅ Individual scores for each analysis area</li>
        <li>🔍 Specific issues identified on your page</li>
        <li>💡 Prioritized recommendations for improvement</li>
        <li>📈 Potential impact on conversion rates</li>
      </ul>
      
      <p>This analysis is designed to help you optimize your landing page for better conversions. Each recommendation is based on proven best practices and real-world data.</p>
      
      <p>Questions? Just reply to this email - I read every message personally!</p>
      
      <p>Best regards,<br>
      <strong>Gene Kobilansky</strong><br>
      <em>Founder, lansky.tech</em></p>
    </div>
    
    <div class="footer">
      <p>
        This report was generated by <a href="https://lansky.tech">lansky.tech</a><br>
        Building better landing pages through data-driven insights
      </p>
    </div>
  </div>
</body>
</html>`;
  }
}