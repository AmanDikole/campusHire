import "dotenv/config"

type PrismaConfig = {
  schema: string
  migrations?: {
    path: string
  }
  datasource?: {
    url?: string
  }
}

const config: PrismaConfig = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
}

export default config
