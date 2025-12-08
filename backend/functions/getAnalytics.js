const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ErrorHandler } = require('../utils/errorHandler');
const Logger = require('../utils/logger');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const documentClient = DynamoDBDocumentClient.from(dynamoClient);

async function scanTable(tableName) {
  const items = [];
  let ExclusiveStartKey;

  do {
    const command = new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey,
    });

    const response = await documentClient.send(command);
    if (response.Items) {
      items.push(...response.Items);
    }
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}

function countApplicationsByStatus(applications) {
  return applications.reduce((acc, app) => {
    const key = (app.status || 'unknown').toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function calculateRates(applicationsByStatus, totalApplications) {
  if (!totalApplications) {
    return {
      interviewRate: 0,
      offerRate: 0,
    };
  }

  const interviewCount =
    (applicationsByStatus.interviewing || 0) +
    (applicationsByStatus.interview || 0);
  const offerCount =
    (applicationsByStatus.offered || 0) +
    (applicationsByStatus.offer || 0);

  return {
    interviewRate: Number(((interviewCount / totalApplications) * 100).toFixed(2)),
    offerRate: Number(((offerCount / totalApplications) * 100).toFixed(2)),
  };
}

function calculateExperienceInsights(experiences) {
  const byUser = experiences.reduce((acc, exp) => {
    if (!exp.userId) {
      return acc;
    }
    acc[exp.userId] = acc[exp.userId] || [];
    acc[exp.userId].push(exp);
    return acc;
  }, {});

  const users = Object.keys(byUser).length || 1;
  let usersWithGaps = 0;
  const gapDurations = [];

  Object.values(byUser).forEach(userExperiences => {
    const sorted = userExperiences
      .filter(exp => exp.startDate)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    let hasGap = false;

    for (let i = 1; i < sorted.length; i += 1) {
      const previousEnd = sorted[i - 1].endDate || sorted[i - 1].startDate;
      const currentStart = sorted[i].startDate;
      if (!previousEnd || !currentStart) {
        continue;
      }

      const previousEndDate = new Date(previousEnd);
      const currentStartDate = new Date(currentStart);
      const diffMonths =
        (currentStartDate.getFullYear() - previousEndDate.getFullYear()) * 12 +
        (currentStartDate.getMonth() - previousEndDate.getMonth());

      if (diffMonths > 6) {
        hasGap = true;
        gapDurations.push(diffMonths);
      }
    }

    if (hasGap) {
      usersWithGaps += 1;
    }
  });

  const averageGaps = gapDurations.length
    ? Number((gapDurations.reduce((sum, val) => sum + val, 0) / gapDurations.length).toFixed(2))
    : 0;

  const averageExperiencesPerUser = Number(
    (experiences.length / users).toFixed(2)
  );

  return {
    averageExperiencesPerUser,
    usersWithDetectedGaps: usersWithGaps,
    averageGapMonths: averageGaps,
  };
}

exports.handler = async () => {
  const logger = new Logger({ component: 'getAnalytics' });

  try {
    const [applications, experiences, users] = await Promise.all([
      scanTable(process.env.APPLICATIONS_TABLE),
      scanTable(process.env.EXPERIENCES_TABLE),
      scanTable(process.env.USERS_TABLE),
    ]);

    const applicationsByStatus = countApplicationsByStatus(applications);
    const totalApplications = applications.length;
    const { interviewRate, offerRate } = calculateRates(
      applicationsByStatus,
      totalApplications
    );

    const averageApplicationsPerUser = Number(
      (totalApplications / (users.length || 1)).toFixed(2)
    );

    const experienceInsights = calculateExperienceInsights(experiences);

    const response = {
      summary: {
        totalUsers: users.length,
        totalApplications,
        totalExperiences: experiences.length,
        applicationsByStatus,
        interviewRate,
        offerRate,
        averageApplicationsPerUser,
        averageExperiencesPerUser: experienceInsights.averageExperiencesPerUser,
      },
      experienceGaps: {
        usersWithGaps: experienceInsights.usersWithDetectedGaps,
        averageGapMonths: experienceInsights.averageGapMonths,
      },
    };

    logger.info('Analytics computed', {
      totalApplications,
      statusBuckets: Object.keys(applicationsByStatus).length,
      users: users.length,
      experiences: experiences.length,
    });

    return ErrorHandler.createSuccessResponse(response);
  } catch (error) {
    logger.error('Failed to compute analytics', {}, error);
    return ErrorHandler.createErrorResponse(error, {
      component: 'getAnalytics',
    });
  }
};
