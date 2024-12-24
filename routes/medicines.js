const express = require('express');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);
const router = express.Router();

router.post('/update-stock', async (req, res) => {
    const { medicineName, neededQuantity } = req.body;

    if (!medicineName || !neededQuantity) {
        return res.status(400).json({ error: 'Medicine name and needed quantity are required' });
    }

    try {
        // Check if the medicine exists and has enough stock
        const [medicine] = await sql`
            SELECT name, stock_quantity , used_quantity
            FROM medicines 
            WHERE name = ${medicineName}
        `;

        if (!medicine) {
            return res.status(404).json({ error: 'Medicine not found' });
        }

        if (medicine.stock_quantity < neededQuantity) {
            return res.status(400).json({ error: 'Not enough stock available' });
        }

        // Subtract the needed quantity from the stock
        const updatedStockQuantity = medicine.stock_quantity - neededQuantity;
        const updatedUsedQuantity = medicine.used_quantity + neededQuantity;

        // Update the stock in the database
        await sql`
            UPDATE medicines
            SET 
                stock_quantity = ${updatedStockQuantity},
                used_quantity = ${updatedUsedQuantity}
            WHERE name = ${medicineName}
        `;

        res.status(200).json({ message: 'Stock updated successfully', updatedStockQuantity });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

router.get('/check-stock', async (req, res) => {
    try {
        const lowStock = await sql`
            SELECT name, stock_quantity, threshold_quantity
            FROM medicines
            WHERE stock_quantity < CAST(threshold_quantity AS INTEGER)
        `;
        res.status(200).json(lowStock);
    } catch (error) {
        console.error('Error checking stock:', error);
        res.status(500).json({ error: 'Failed to fetch stock levels' });
    }
});
router.get('/used', async (req, res) => {
    try {
        // Fetch all medicines with name and stock_quantity
        const medicines = await sql`
            SELECT name, used_quantity 
            FROM medicines
        `;

        // Return the result
        res.status(200).json({
            data: medicines,
        });
    } catch (error) {
        console.error('Error retrieving medicines:', error);
        res.status(500).json({ error: 'Failed to retrieve medicines' });
    }
});
router.get('/stock', async (req, res) => {
    try {
        // Fetch all medicines with name and stock_quantity
        const medicines = await sql`
            SELECT name, stock_quantity 
            FROM medicines
        `;

        // Return the result
        res.status(200).json({
            data: medicines,
        });
    } catch (error) {
        console.error('Error retrieving medicines:', error);
        res.status(500).json({ error: 'Failed to retrieve medicines' });
    }
});


module.exports = router;
