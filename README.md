# Asterisk AMI Dashboard

A real-time dashboard for monitoring Asterisk PBX using the Asterisk Manager Interface (AMI). Built with React/TypeScript frontend and Node.js backend.

## Features

- Real-time call monitoring
- Extension/Peer status tracking
- AMI event debug log with clickable event details
- WebSocket-based live updates

## Prerequisites

- Node.js 18+
- Asterisk PBX with AMI enabled

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Isaac1th/asterisk-ami.git
cd asterisk-ami
```

2. Install dependencies:
```bash
npm run install:all
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Asterisk AMI credentials:
```
AMI_HOST=your-asterisk-server-ip
AMI_PORT=5038
AMI_USER=admin
AMI_PASS=your-ami-password
```

## Usage

### Development

Run both frontend and backend in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
npm run dev:server  # Backend only
npm run dev:client  # Frontend only
```

### Production

Build the frontend:
```bash
npm run build
```

Start the server:
```bash
npm start
```

## Project Structure

```
asterisk-ami/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript types
│   │   └── styles/         # CSS styles
│   └── ...
├── server/                 # Node.js backend
│   ├── ami/                # AMI connection handlers
│   ├── socket/             # WebSocket handlers
│   ├── routes/             # API routes
│   └── server.js           # Entry point
└── ...
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch strategy and workflow guidelines.

## License

ISC
