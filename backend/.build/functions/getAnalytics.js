"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const errorHandler_1 = require("../utils/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const dynamoClient = new client_dynamodb_1.DynamoDBClient({ region: process.env.AWS_REGION });
const documentClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
async function scanTable(tableName) {
    const items = [];
    let ExclusiveStartKey;
    do {
        const command = new lib_dynamodb_1.ScanCommand({
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
    const interviewCount = (applicationsByStatus.interviewing || 0) +
        (applicationsByStatus.interview || 0);
    const offerCount = (applicationsByStatus.offered || 0) +
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
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        let hasGap = false;
        for (let i = 1; i < sorted.length; i += 1) {
            const previousEnd = sorted[i - 1].endDate || sorted[i - 1].startDate;
            const currentStart = sorted[i].startDate;
            if (!previousEnd || !currentStart) {
                continue;
            }
            const previousEndDate = new Date(previousEnd);
            const currentStartDate = new Date(currentStart);
            const diffMonths = (currentStartDate.getFullYear() - previousEndDate.getFullYear()) * 12 +
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
    const averageExperiencesPerUser = Number((experiences.length / users).toFixed(2));
    return {
        averageExperiencesPerUser,
        usersWithDetectedGaps: usersWithGaps,
        averageGapMonths: averageGaps,
    };
}
const handler = async () => {
    const logger = new logger_1.default({ component: 'getAnalytics' });
    try {
        const [applications, experiences, users] = await Promise.all([
            scanTable(process.env.APPLICATIONS_TABLE || 'Applications'),
            scanTable(process.env.EXPERIENCES_TABLE || 'Experiences'),
            scanTable(process.env.USERS_TABLE || 'Users'),
        ]);
        const applicationsByStatus = countApplicationsByStatus(applications);
        const totalApplications = applications.length;
        const { interviewRate, offerRate } = calculateRates(applicationsByStatus, totalApplications);
        const averageApplicationsPerUser = Number((totalApplications / (users.length || 1)).toFixed(2));
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
        return errorHandler_1.ErrorHandler.createSuccessResponse(response);
    }
    catch (error) {
        logger.error('Failed to compute analytics', {}, error);
        return errorHandler_1.ErrorHandler.createErrorResponse(error, {
            component: 'getAnalytics',
        });
    }
};
exports.handler = handler;
