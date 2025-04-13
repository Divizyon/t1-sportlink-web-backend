# User Event Filtering System

This project is a system that allows users to filter pending events.

## Features

- Users can view pending events
- Events can be filtered by status
- Event details can be examined
- Events can be approved or rejected

## Technical Details

### Database Structure

```typescript
interface Event {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  userId: number;
}
```

### API Endpoints

- `GET /api/events/pending` - Lists pending events
- `GET /api/events/pending?status=pending` - Filters events by specific status
- `PUT /api/events/:id/status` - Updates event status

### Filtering Options

1. **Status Filtering**
   - Pending
   - Approved
   - Rejected

2. **Date Filtering**
   - Last 24 hours
   - Last 7 days
   - Last 30 days
   - Custom date range

3. **User Filtering**
   - Events of a specific user
   - Events of all users

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure database connection:
```bash
cp .env.example .env
# Edit .env file
```

3. Run database migrations:
```bash
npm run migrate
```

4. Start the application:
```bash
npm run dev
```

## Usage

1. Log in to the system
2. Go to "Events" menu
3. Select "Pending" tab
4. Apply desired filters
5. View events and perform necessary actions

## Security

- All API requests are protected with JWT token
- Authorization is based on user roles
- Rate limiting is implemented

## Error Handling

- Error handling mechanism is available for all API requests
- User-friendly error messages are displayed
- Error logs are recorded

## Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 
