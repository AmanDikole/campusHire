# Seed Data Documentation

This document describes what is created by [`prisma/seed.ts`](../prisma/seed.ts).

## Overview

- The script seeds **2 colleges**.
- It creates **3 users per college**: `tpo`, `hr`, and `student`.
- All seeded users use the same password before hashing: `admin123`.
- It also seeds SaaS plans and initializes each college with a **14-day Free trial subscription**.

## Seeded Colleges

1. `MIT World Peace University`
- Subdomain: `mit`
- Location: `Pune, India`

2. `COEP Technological University`
- Subdomain: `coep`
- Location: `Pune, India`

## Seeded Users

For each college, these users are created:

1. TPO
- MIT: `admin@mit.edu`
- COEP: `admin@coep.edu`
- Role: `tpo`

2. HR
- MIT: `hr@mit.edu`
- COEP: `hr@coep.edu`
- Role: `hr`
- Company names:
  - MIT HR: `TechCorp`
  - COEP HR: `InnovateX`

3. Student
- MIT: `student@mit.edu`
- COEP: `student@coep.edu`
- Role: `student`
- Profile created with:
  - MIT student: `Amit Sharma`, branch `CSE`, `cgpa: 8.5`
  - COEP student: `Priya Patil`, branch `ENTC`, `cgpa: 9.2`

## Seeded SaaS Plans

- `free`: `Rs. 0`, student limit `100`, job limit `5`, analytics `disabled`
- `basic`: `Rs. 1999`, student limit `500`, job limit `20`, analytics `enabled`
- `pro`: `Rs. 4999`, unlimited students/jobs, analytics `enabled`
- `enterprise`: `Rs. 9999`, unlimited students/jobs, analytics `enabled`

## Seeded College Subscriptions

- Each seeded college gets one `CollegeSubscription`:
  - Plan: `free`
  - Status: `trialing`
  - Payment status: `none`
  - Trial length: `14 days`

## Login Credentials (Seed Defaults)

- Password for all seeded users: `admin123`

Examples:
- `admin@mit.edu / admin123` (TPO)
- `hr@mit.edu / admin123`
- `admin@coep.edu / admin123` (TPO)
- `hr@coep.edu / admin123`

## Run Seeding

Use:

```bash
npx prisma db seed
```

(`package.json` already maps Prisma seed to `ts-node prisma/seed.ts`.)

## Notes

- Passwords are hashed with `bcryptjs` (`hash(..., 12)`).
- Script assumes a clean DB state for unique fields (for example, unique college subdomains and user email+college combinations).
