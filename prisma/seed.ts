import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

function addDays(base: Date, days: number) {
  const result = new Date(base)
  result.setDate(result.getDate() + days)
  return result
}

async function main() {
  const password = await hash('admin123', 12)
  const now = new Date()
  const trialEndsAt = addDays(now, 14)

  // Plans
  const freePlan = await prisma.plan.upsert({
    where: { key: "free" },
    update: {},
    create: {
      key: "free",
      name: "Free",
      monthlyPriceInr: 0,
      studentLimit: 100,
      jobLimit: 5,
      analyticsAccess: false,
      isActive: true,
    },
  })

  await prisma.plan.upsert({
    where: { key: "basic" },
    update: {},
    create: {
      key: "basic",
      name: "Basic",
      monthlyPriceInr: 1999,
      studentLimit: 500,
      jobLimit: 20,
      analyticsAccess: true,
      isActive: true,
    },
  })

  await prisma.plan.upsert({
    where: { key: "pro" },
    update: {},
    create: {
      key: "pro",
      name: "Pro",
      monthlyPriceInr: 4999,
      studentLimit: null,
      jobLimit: null,
      analyticsAccess: true,
      isActive: true,
    },
  })

  await prisma.plan.upsert({
    where: { key: "enterprise" },
    update: {},
    create: {
      key: "enterprise",
      name: "Enterprise",
      monthlyPriceInr: 9999,
      studentLimit: null,
      jobLimit: null,
      analyticsAccess: true,
      isActive: true,
    },
  })

  // --- 1. Create College A: MIT ---
  console.log("Creating College A: MIT...")
  const collegeA = await prisma.college.create({
    data: {
      name: "MIT World Peace University",
      subdomain: "mit",
      location: "Pune, India",
      phone: "+91 9999999001",
      website: "https://mitwpu.edu.in",
      details: "Private university with strong engineering and management programs.",
      status: "active",
    },
  })

  // Create TPO for MIT
  await prisma.user.create({
    data: {
      email: 'admin@mit.edu',
      password,
      role: 'tpo',
      collegeId: collegeA.id,
      profile: {
        create: {
          fullName: "MIT TPO",
        },
      },
    },
  })

  await prisma.user.create({
    data: {
      email: 'hr@mit.edu',
      password,
      role: 'hr',
      companyName: 'TechCorp',
      collegeId: collegeA.id,
    },
  })

  await prisma.user.create({
    data: {
      email: 'student@mit.edu',
      password,
      role: 'student',
      collegeId: collegeA.id,
      profile: {
        create: {
          fullName: "Amit Sharma",
          branch: "CSE",
          cgpa: 8.5,
          verificationStatus: "Approved",
        },
      },
    },
  })

  await prisma.collegeSubscription.create({
    data: {
      collegeId: collegeA.id,
      planId: freePlan.id,
      status: "trialing",
      paymentStatus: "none",
      startDate: now,
      endDate: trialEndsAt,
      trialEndsAt,
    },
  })

  // --- 2. Create College B: COEP ---
  console.log("Creating College B: COEP...")
  const collegeB = await prisma.college.create({
    data: {
      name: "COEP Technological University",
      subdomain: "coep",
      location: "Pune, India",
      phone: "+91 9999999002",
      website: "https://coep.org.in",
      details: "Public technical university with core engineering excellence.",
      status: "active",
    },
  })

  await prisma.user.create({
    data: {
      email: 'admin@coep.edu',
      password,
      role: 'tpo',
      collegeId: collegeB.id,
      profile: {
        create: {
          fullName: "COEP TPO",
        },
      },
    },
  })

  await prisma.user.create({
    data: {
      email: 'hr@coep.edu',
      password,
      role: 'hr',
      companyName: 'InnovateX',
      collegeId: collegeB.id,
    },
  })

  await prisma.user.create({
    data: {
      email: 'student@coep.edu',
      password,
      role: 'student',
      collegeId: collegeB.id,
      profile: {
        create: {
          fullName: "Priya Patil",
          branch: "ENTC",
          cgpa: 9.2,
          verificationStatus: "Approved",
        },
      },
    },
  })

  await prisma.collegeSubscription.create({
    data: {
      collegeId: collegeB.id,
      planId: freePlan.id,
      status: "trialing",
      paymentStatus: "none",
      startDate: now,
      endDate: trialEndsAt,
      trialEndsAt,
    },
  })

  console.log("Seeding complete. You can now log in as:")
  console.log("   - MIT TPO: admin@mit.edu / admin123")
  console.log("   - MIT HR: hr@mit.edu / admin123")
  console.log("   - COEP TPO: admin@coep.edu / admin123")
  console.log("   - COEP HR: hr@coep.edu / admin123")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
