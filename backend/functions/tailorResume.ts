import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Logger from '../utils/logger';
import { ErrorHandler, ApiErrorResponse } from '../utils/errorHandler';
import { RequestHandler } from '../utils/requestHandler';

const logger = new Logger({ function: 'tailorResume' });

interface TailorRequest {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
}

interface TailoredSection {
  original: string;
  tailored: string;
  changes: string[];
  matchScore: number;
}

interface TailoringResult {
  summary: string;
  sections: TailoredSection[];
  overallScore: number;
  keywordsAdded: string[];
  keywordsRemoved: string[];
  suggestions: string[];
}

const KEYWORDS_WEIGHT = {
  technical: [
    'python',
    'javascript',
    'react',
    'aws',
    'docker',
    'kubernetes',
    'sql',
    'machine learning',
    'ai',
  ],
  soft: [
    'leadership',
    'communication',
    'team',
    'problem-solving',
    'agile',
    'scrum',
  ],
  action: [
    'developed',
    'implemented',
    'led',
    'optimized',
    'increased',
    'reduced',
  ],
};

function extractKeywords(text: string): Set<string> {
  const words = text.toLowerCase().match(/\b[a-z]+(?:\+[a-z]+)*\b/g) || [];
  return new Set(words);
}

function calculateMatchScore(
  resumeKeywords: Set<string>,
  jobKeywords: Set<string>
): number {
  if (jobKeywords.size === 0) return 100;

  let matches = 0;
  jobKeywords.forEach(keyword => {
    if (resumeKeywords.has(keyword)) matches++;
  });

  return Math.round((matches / jobKeywords.size) * 100);
}

function suggestKeywordAdditions(
  resumeKeywords: Set<string>,
  jobKeywords: Set<string>
): string[] {
  const additions: string[] = [];
  jobKeywords.forEach(keyword => {
    if (!resumeKeywords.has(keyword) && keyword.length > 3) {
      additions.push(keyword);
    }
  });
  return additions.slice(0, 5);
}

function tailoreSection(
  section: string,
  jobKeywords: Set<string>,
  resumeKeywords: Set<string>
): { tailored: string; changes: string[]; matchScore: number } {
  const changes: string[] = [];
  let tailored = section;

  jobKeywords.forEach(keyword => {
    if (resumeKeywords.has(keyword)) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = tailored.match(regex);
      if (matches && matches.length > 0) {
        changes.push(`Highlighted existing keyword: "${keyword}"`);
      }
    }
  });

  KEYWORDS_WEIGHT.action.forEach(actionVerb => {
    if (!tailored.toLowerCase().includes(actionVerb)) {
      changes.push(`Consider adding action verbs like "${actionVerb}"`);
    }
  });

  const sectionKeywords = extractKeywords(tailored);
  const score = calculateMatchScore(sectionKeywords, jobKeywords);

  return { tailored, changes, matchScore: score };
}

function generateSuggestions(
  resumeKeywords: Set<string>,
  jobKeywords: Set<string>,
  currentScore: number
): string[] {
  const suggestions: string[] = [];

  const missingTechnical = suggestKeywordAdditions(
    resumeKeywords,
    new Set(KEYWORDS_WEIGHT.technical.filter(k => jobKeywords.has(k)))
  );
  if (missingTechnical.length > 0) {
    suggestions.push(
      `Add technical skills mentioned in job: ${missingTechnical.join(', ')}`
    );
  }

  if (currentScore < 50) {
    suggestions.push('Focus on quantifying achievements with specific metrics');
  }

  if (currentScore < 70) {
    suggestions.push(
      'Rearrange experience to lead with most relevant achievements'
    );
  }

  suggestions.push('Use exact phrasing from job description where applicable');
  suggestions.push('Keep resume concise - aim for 1-2 pages');

  return suggestions;
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: { functionName: string }
): Promise<APIGatewayProxyResult | ApiErrorResponse> => {
  const requestId = context.functionName;
  const requestHandler = new RequestHandler('tailorResume', { requestId });

  try {
    if (event.httpMethod !== 'POST') {
      return ErrorHandler.createErrorResponse(
        {
          name: 'ValidationError',
          message: 'This endpoint only accepts POST requests',
        },
        { requestId }
      );
    }

    const body = requestHandler.parseBody<TailorRequest>(event, [
      'resumeText',
      'jobDescription',
    ]);

    logger.info('Tailoring resume', {
      resumeLength: body.resumeText.length,
      jobDescriptionLength: body.jobDescription.length,
      jobTitle: body.jobTitle,
    });

    const resumeKeywords = extractKeywords(body.resumeText);
    const jobKeywords = extractKeywords(body.jobDescription);

    const resumeLines = body.resumeText
      .split('\n\n')
      .filter(line => line.trim());
    const sections: TailoredSection[] = resumeLines.map((line: string) => {
      const { tailored, changes, matchScore } = tailoreSection(
        line,
        jobKeywords,
        resumeKeywords
      );
      return {
        original: line,
        tailored,
        changes,
        matchScore,
      };
    });

    const overallScore = Math.round(
      sections.reduce((sum, s) => sum + s.matchScore, 0) / sections.length
    );

    const keywordsAdded = Array.from(jobKeywords).filter(
      k => !resumeKeywords.has(k) && k.length > 3
    );
    const keywordsRemoved: string[] = [];

    const suggestions = generateSuggestions(
      resumeKeywords,
      jobKeywords,
      overallScore
    );

    const summary =
      overallScore >= 70
        ? 'Your resume is well-aligned with this job. Focus on the specific suggestions to maximize your chances.'
        : overallScore >= 50
          ? 'Your resume has moderate alignment. Review the suggestions to improve keyword matching.'
          : 'Your resume needs significant tailoring for this role. Add relevant keywords and restructure your achievements.';

    const result: TailoringResult = {
      summary,
      sections,
      overallScore,
      keywordsAdded: keywordsAdded.slice(0, 10),
      keywordsRemoved,
      suggestions,
    };

    logger.info('Resume tailored successfully', {
      overallScore,
      sectionsCount: sections.length,
      keywordsAddedCount: keywordsAdded.length,
    });

    return ErrorHandler.createSuccessResponse(result);
  } catch (error) {
    logger.error('Error tailoring resume', { error }, error as Error);
    return ErrorHandler.createErrorResponse(error as Error, { requestId });
  }
};
