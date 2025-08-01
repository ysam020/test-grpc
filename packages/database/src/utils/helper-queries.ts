import { prisma } from '../client';

async function getMonthlyRecordCounts(
    tableName: string,
    dateField = 'createdAt',
    userIDField?: string,
    distinctUsers = false,
    fromDate?: string,
    endDate?: string,
) {
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];

    // Define the default date range (last year including the current month)
    const today = new Date();

    const requiredStartDate = new Date();
    requiredStartDate.setMonth(requiredStartDate.getMonth() - 1);

    const startYear = today.getFullYear() - 1;

    // Calculate the startDate with one year and one month ago
    const startDate =
        fromDate ||
        `${requiredStartDate.getFullYear() - 1}-${String(requiredStartDate.getMonth() + 1).padStart(2, '0')}-${String(requiredStartDate.getDate()).padStart(2, '0')} 00:00:00.000`;

    const currentDate =
        endDate ||
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} 23:59:59.999`;

    const countField = distinctUsers
        ? `COUNT(DISTINCT "${userIDField}")`
        : `COUNT(*)`;

    // Fetch monthly data grouped by year and month
    const result = await prisma.$queryRawUnsafe<
        { month: number; year: number; count: bigint }[]
    >(`
    SELECT 
      EXTRACT(MONTH FROM "${dateField}") AS month, 
      EXTRACT(YEAR FROM "${dateField}") AS year, 
      ${countField} AS count
    FROM "${tableName}"
    WHERE "${dateField}" BETWEEN '${startDate}' AND '${currentDate}'
    GROUP BY year, month
    ORDER BY year, month;
  `);

    // Create a map with default values set to 0
    const dataMap: Record<string, number> = {};

    // Populate the dataMap with query results
    result.forEach(({ month, year, count }) => {
        dataMap[`${months[month - 1]}-${String(year).slice(-2)}`] =
            Number(count);
    });

    // Generate formatted results with default values for missing months
    const formattedResult = [];
    let previousValue = 0;

    for (let year of [startYear, today.getFullYear()]) {
        for (let i = 0; i < 12; i++) {
            const label = `${months[i]}-${String(year).slice(-2)}`;
            const value = dataMap[label] || 0;

            let percentageDiff = 0.0;

            if (previousValue !== 0) {
                percentageDiff =
                    ((value - previousValue) / previousValue) * 100;
            } else if (previousValue === 0 && value !== 0) {
                percentageDiff = 100.0;
            }

            formattedResult.push({
                label,
                value,
                percentage_diff: percentageDiff.toFixed(2) + '%',
            });

            previousValue = value;

            // Stop adding future months in the current year
            if (year === today.getFullYear() && i === today.getMonth()) break;
        }
    }

    return formattedResult.slice(-13);
}

async function getWeeklyRecordCounts(
    tableName: string,
    dateField = 'createdAt',
    userIDField?: string,
    distinctUsers = false,
    fromDate?: string,
    endDate?: string,
) {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let dateFilter = '';

    if (fromDate && endDate) {
        dateFilter = `AND ${dateField} BETWEEN ${fromDate} AND ${endDate}`;
    }

    const date = new Date();
    const lastStartDate = new Date();
    lastStartDate.setDate(date.getDate() - 7);
    let startDate = `${lastStartDate.getFullYear()}-${lastStartDate.getMonth() + 1}-${lastStartDate.getDate()} 00:00:00.000`;
    let currentDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} 23:59:59.999`;

    const countField = distinctUsers
        ? `COUNT(DISTINCT "${userIDField}")`
        : `COUNT(*)`;

    const result = await prisma.$queryRawUnsafe<
        { day: number; count: number }[]
    >(`
      SELECT
        EXTRACT(DOW FROM "${dateField}") AS day,
        ${countField} AS count
      FROM
        "${tableName}" 
      WHERE
       1 = 1
       and "${dateField}" between '${startDate}' and '${currentDate}'
      GROUP BY
        EXTRACT(DOW FROM "${dateField}")
      ORDER BY
        day;
    `);

    const dataMap: Record<string, number> = {};

    result.forEach((row) => {
        const day = daysOfWeek[row.day];
        dataMap[day as string] = Number(row.count);
    });

    const formattedData = [];
    let previousValue = 0;

    for (const day of daysOfWeek) {
        const value = dataMap[day] || 0;
        let percentageDiff = 0.0;

        if (previousValue !== 0) {
            percentageDiff = ((value - previousValue) / previousValue) * 100;
        } else if (previousValue === 0 && value !== 0) {
            percentageDiff = 100.0;
        }

        formattedData.push({
            label: day,
            value,
            percentage_diff: percentageDiff.toFixed(2) + '%',
        });

        previousValue = value;
    }

    return formattedData;
}

async function getYearlyRecordCounts(
    tableName: string,
    dateField = 'createdAt',
    userIDField?: string,
    distinctUsers = false,
    fromDate?: string,
    endDate?: string,
) {
    let dateFilter = '';

    if (fromDate && endDate) {
        dateFilter = `AND ${dateField} BETWEEN ${fromDate} AND ${endDate}`;
    }

    const date = new Date();
    const lastStartDate = new Date();
    lastStartDate.setFullYear(date.getFullYear() - 6);
    let startDate = `${lastStartDate.getFullYear()}-${lastStartDate.getMonth() + 1}-${lastStartDate.getDate()} 00:00:00.000`;
    let currentDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} 23:59:59.999`;

    const countField = distinctUsers
        ? `COUNT(DISTINCT "${userIDField}")`
        : `COUNT(*)`;

    const result = await prisma.$queryRawUnsafe<
        { year: number; count: number }[]
    >(`
      SELECT
        EXTRACT(YEAR FROM "${dateField}") AS year,
        ${countField} AS count
      FROM
        "${tableName}"
      WHERE
         1 = 1
         AND "${dateField}" BETWEEN '${startDate}' AND '${currentDate}'
      GROUP BY
        EXTRACT(YEAR FROM "${dateField}")
      ORDER BY
        year;
    `);

    const currentYear = date.getFullYear();
    const allYears = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

    const dataMap: Record<string, number> = {};

    result.forEach((row) => {
        dataMap[row.year.toString()] = Number(row.count);
    });

    let previousValue = 0;
    const formattedData = [];

    for (const year of allYears) {
        const value = dataMap[year.toString()] || 0;

        let percentageDiff = 0.0;
        if (previousValue !== 0) {
            percentageDiff = ((value - previousValue) / previousValue) * 100;
        } else if (previousValue === 0 && value !== 0) {
            percentageDiff = 100.0;
        }

        previousValue = value;

        // Exclude the extra year from response, only use it for calculations
        if (year !== currentYear - 5) {
            formattedData.push({
                label: year.toString(),
                value,
                percentage_diff: percentageDiff.toFixed(2) + '%',
            });
        }
    }

    return formattedData;
}

export { getMonthlyRecordCounts, getWeeklyRecordCounts, getYearlyRecordCounts };
