import express from 'express';
import { insertBooking, getBookingsByTenant, getBookingById } from './booking.service.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Extract tenant from header
function tenantMiddleware(req, res, next) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
        return res.status(400).json({ error: 'Missing X-Tenant-ID header' });
    }
    req.tenantId = tenantId;
    next();
}

app.use('/bookings', tenantMiddleware);

// Create booking
app.post('/bookings', async (req, res) => {
    try {
        const idempotencyKey = req.headers['x-idempotency-key'];
        if (!idempotencyKey) {
            return res.status(400).json({ error: 'Missing X-Idempotency-Key header' });
        }

        const { start_time_utc } = req.body;
        if (!start_time_utc) {
            return res.status(400).json({ error: 'Missing start_time_utc in request body' });
        }

        const parsedTime = new Date(start_time_utc);
        if (isNaN(parsedTime.getTime())) {
            return res.status(400).json({ error: 'Invalid start_time_utc format' });
        }

        const result = await insertBooking(req.tenantId, start_time_utc, idempotencyKey);

        if (result.conflict) {
            return res.status(409).json({
                error: 'Slot already booked',
                existing_booking_id: result.existingBooking?.id
            });
        }

        const statusCode = result.created ? 201 : 200;
        return res.status(statusCode).json({
            created: result.created,
            booking: result.booking
        });

    } catch (error) {
        console.error('Error creating booking:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// List bookings for tenant
app.get('/bookings', async (req, res) => {
    try {
        const bookings = await getBookingsByTenant(req.tenantId);
        return res.json({ tenant_id: req.tenantId, count: bookings.length, bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get specific booking
app.get('/bookings/:id', async (req, res) => {
    try {
        const booking = await getBookingById(req.tenantId, req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        return res.json({ booking });
    } catch (error) {
        console.error('Error fetching booking:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
