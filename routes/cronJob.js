const cron = require('node-cron');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);
cron.schedule('0 0 * * *', async () => {
    try {
        const queue = await sql`SELECT COUNT(*) AS queue_length FROM queue WHERE status = 'waiting'`;
        const avgServiceTime = await sql`
        SELECT AVG(EXTRACT(EPOCH FROM service_time)::numeric) AS avg_time_in_seconds 
        FROM prescriptions 
        WHERE service_time IS NOT NULL
    `;
    const avgWaitTime = await sql`
        SELECT AVG(EXTRACT(EPOCH FROM wait_time)::numeric) AS avg_time_in_seconds 
        FROM queue 
        WHERE wait_time IS NOT NULL
    `;
    const avgTime = parseFloat(avgServiceTime[0].avg_time_in_seconds);
    const formattedValueSer = avgTime.toFixed(2);
    const avgwait = parseFloat(avgWaitTime[0].avg_time_in_seconds);
    const formattedValueWai = avgwait.toFixed(2);
        await sql`
            INSERT INTO metrics (queue_length, average_service_time, average_wait_time)
            VALUES (${queue[0].queue_length}, ${formattedValueSer}, ${formattedValueWai})
        `;
        console.log('Metrics updated');
    } catch (error) {
        console.error('Error updating metrics:', error);
    }
});
