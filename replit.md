# Google Sheets Writer API

## Overview

This is a Node.js application built with Express that provides an HTTP API for writing data to Google Sheets. The application is designed to be deployed on Google Cloud Run and accepts JSON payloads with commands and values that are then written to a Google Spreadsheet.

## System Architecture

### Backend Architecture
- **Framework**: Express.js (Node.js 18+)
- **Runtime**: Node.js with Alpine Linux container
- **API Style**: RESTful HTTP endpoints
- **Authentication**: Google Service Account with OAuth2
- **Deployment**: Docker containerized for Google Cloud Run

### Key Technologies
- **googleapis**: Official Google APIs Node.js client library
- **google-auth-library**: Google authentication and authorization
- **body-parser**: HTTP request body parsing middleware
- **dotenv**: Environment variable configuration management

## Key Components

### 1. HTTP Server (server.js)
- Express.js web server handling HTTP requests
- CORS middleware for cross-origin requests
- JSON body parsing with 10MB limit
- Health check endpoint for cloud deployment monitoring

### 2. Google Sheets Integration
- **Primary Endpoint**: POST `/` - Accepts JSON with `command` and `value` fields
- **Expected Format**: `{ "command": "впиши", "value": "data to write" }`
- **Sheet Writing**: Appends data as new rows with timestamp, command, and value
- **Target Range**: Configurable sheet range (default: "Лист1!A:C")

### 3. Authentication System
- Service account-based authentication for Google APIs
- Automatic credential detection in Google Cloud environments
- Local development support via service account key files
- IAM role-based access control

### 4. Health Monitoring
- `/health` endpoint for container health checks
- Status reporting with timestamp and service identification
- Docker health check configuration with retry logic

## Data Flow

1. **Request Reception**: Client sends POST request with JSON payload
2. **Authentication**: Google Auth library authenticates using service account
3. **Sheet Access**: Google Sheets API connects to specified spreadsheet
4. **Data Preparation**: Formats data with current timestamp, command, and value
5. **Sheet Writing**: Appends new row to the specified sheet range
6. **Response**: Returns confirmation of successful write operation

## External Dependencies

### Google Cloud Services
- **Google Sheets API**: Core functionality for spreadsheet operations
- **Google Cloud Run**: Container hosting and scaling
- **Google Container Registry**: Docker image storage
- **Google Cloud Build**: CI/CD pipeline for automated deployment

### Required Permissions
- Google Sheets API access
- Service account with appropriate IAM roles
- Spreadsheet sharing permissions for the service account

### Environment Configuration
- `GOOGLE_SPREADSHEET_ID`: Target Google Sheets document ID
- `GOOGLE_SHEET_RANGE`: Cell range for data writing (default: "Лист1!A:C")
- `PORT`: Server port (default: 8080)
- `HOST`: Server host binding (default: 0.0.0.0)
- `NODE_ENV`: Environment mode (production/development)

## Deployment Strategy

### Containerization
- Multi-stage Docker build with Node.js 18 Alpine base
- Production-only dependency installation
- Non-root user execution for security
- Health check integration
- Resource optimization (512Mi memory, 1 CPU)

### Cloud Run Configuration
- Automatic scaling (max 10 instances)
- 300-second timeout for long-running operations
- Unauthenticated access for public API
- Environment variable injection
- Service account association

### CI/CD Pipeline
- Google Cloud Build integration
- Automated container building and pushing
- Direct deployment to Cloud Run
- Substitution variables for configuration management

## Changelog
- June 26, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.