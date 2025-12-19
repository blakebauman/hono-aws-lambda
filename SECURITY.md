# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please do NOT create a public GitHub issue. Instead, please email security@example.com with the following information:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Features

This project implements comprehensive security measures:

- **Authentication**: Better Auth with secure session management
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: All inputs validated with Zod schemas
- **Rate Limiting**: Per-IP, per-user, and per-endpoint rate limiting
- **Security Headers**: CSP, HSTS, X-Frame-Options, and more
- **CSRF Protection**: Cross-site request forgery protection
- **Secrets Management**: AWS Secrets Manager integration
- **Encryption**: Encryption at rest and in transit
- **Logging**: Security event logging and monitoring
- **Dependency Scanning**: Automated vulnerability scanning

## Best Practices

- Never commit secrets or API keys to the repository
- Use AWS Secrets Manager for sensitive configuration
- Keep dependencies up to date
- Review security advisories regularly
- Use least privilege IAM policies
- Enable MFA for production deployments
- Regular security audits and penetration testing

