import { streamText, tool } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/auth';

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || '',
});

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();
    const session = await auth();

    let systemPrompt = `You are a professional and helpful CampusHire representative.
    CampusHire is a platform connecting students, colleges, training and placement officers, and HR professionals for campus recruitment. 
    
    CRITICAL: Keep your responses short, sweet, and to the point. Typically aim for under 3 sentences unless you are providing a list of jobs or stats. Avoid long explanations.
    Always be concise, polite, and helpful. Use markdown to make text readable.
    
    IMPORTANT: Do not mention that you are an AI, a chatbot, or that you have "tools" or "database access". 
    If you do not have specific information, suggest reaching out to "CampusHire Support Team" or "contacting the company directly".`;

    if (session?.user) {
        systemPrompt = `You are a professional and helpful CampusHire representative assisting a logged-in user.
        User Email: ${session.user.email}
        User Role: ${session.user.role}
        User College Subdomain: ${(session.user as any).collegeSubdomain}
        
        CRITICAL: Keep your responses very short and sweet (max 2-3 sentences) unless you are listing specific data. 
        Focus on providing immediate value.
        
        If they ask about their data, use your tools. 
        As a Representative, you can proactively check if they are eligible for jobs using their profile stats.
        Format your response in professional markdown. 
        
        IMPORTANT: Do not discuss internal bot mechanics or say you "don't have info" if a tool exists. If you can't find a specific job, suggest reaching out to the support team.`;

        if (session.user.role === 'student') {
            systemPrompt += `\n\nYou are talking to a STUDENT. You should proactively help them find jobs they are eligible for. Use the 'getRecommendedJobsForMe' tool if they ask about jobs for them.`;
        }

        // Inject Role Specific Prompt Data
        if (session.user.role === 'tpo' || session.user.role === 'admin') {
            systemPrompt += `\n\n[Role-Specific Information: TPO/Admin]
            You are assisting a Placement Officer/Admin managing Subscription & Billing.
            Keep billing/plan answers extremely concise.`;
        }
    }

    const aiTools: any = {
        getPlatformStats: tool({
            description: 'Get the overall statistics of the CampusHire platform like number of colleges, students, and active jobs. Available for any user.',
            parameters: z.object({}),
            execute: async () => {
                const [colleges, students, jobs] = await Promise.all([
                    db.college.count(),
                    db.user.count({ where: { role: 'student' } }),
                    db.job.count({ where: { isActive: true } }),
                ]);
                return {
                    totalColleges: colleges,
                    totalStudents: students,
                    totalActiveJobs: jobs,
                };
            },
        }),
        getActiveJobs: tool({
            description: 'Get a list of some currently active jobs on the overall platform. Returns a summary of titles and companies. Available for any user.',
            parameters: z.object({
                limit: z.number().optional().describe('Number of jobs to retrieve, max 10.'),
            }),
            execute: async ({ limit = 5 }) => {
                const jobs = await db.job.findMany({
                    where: { isActive: true },
                    take: limit,
                    select: { title: true, company: true, location: true },
                    orderBy: { createdAt: 'desc' },
                });
                return { jobs };
            },
        }),
    };

    // Add personalized tools based on role
    if (session?.user?.id) {
        if (session.user.role === 'hr' || session.user.role === 'admin' || session.user.role === 'tpo') {
            aiTools.getMyPostedJobs = tool({
                description: 'Get a list of jobs posted specifically by the logged-in user. Call this if the user asks "How many jobs have I posted?" or "Show my jobs".',
                parameters: z.object({}),
                execute: async () => {
                    const jobs = await db.job.findMany({
                        where: { postedById: session.user?.id },
                        select: { title: true, company: true, location: true, isActive: true, createdAt: true }
                    });
                    return {
                        totalPosted: jobs.length,
                        jobs: jobs.slice(0, 10) // Limit output strictly context size
                    };
                }
            });

            aiTools.getMySubscriptionDetails = tool({
                description: 'Get the current subscription plan details, student usage count, and job posting usage count for the logged-in TPO/Admin\'s college tenant.',
                parameters: z.object({}),
                execute: async () => {
                    const collegeId = (session.user as any).collegeId;
                    if (!collegeId) return { error: "No college tenant found for user." };

                    const [studentsCount, jobsCount, subscription] = await Promise.all([
                        db.user.count({ where: { collegeId: collegeId, role: 'student' } }),
                        db.job.count({ where: { collegeId: collegeId } }),
                        db.collegeSubscription.findFirst({
                            where: { collegeId: collegeId, status: { in: ['active', 'trialing', 'past_due'] } },
                            include: { plan: true },
                            orderBy: { createdAt: 'desc' }
                        })
                    ]);

                    return {
                        currentPlanName: subscription?.plan?.name || "Free",
                        subscriptionStatus: subscription?.status || "Trialing",
                        paymentStatus: subscription?.paymentStatus || "None",
                        studentUsageCount: studentsCount,
                        studentLimit: subscription?.plan?.studentLimit || 100, // 100 is Free tier default
                        jobPostingUsageCount: jobsCount,
                        jobLimit: subscription?.plan?.jobLimit || 5, // 5 is Free tier default
                        subscriptionWindow: subscription ? `${subscription.startDate ? subscription.startDate.toISOString().split('T')[0] : 'N/A'} to ${subscription.endDate ? subscription.endDate.toISOString().split('T')[0] : (subscription.trialEndsAt ? subscription.trialEndsAt.toISOString().split('T')[0] : 'N/A')}` : "N/A"
                    };
                }
            });
        }

        if (session.user.role === 'student') {
            aiTools.getMyApplications = tool({
                description: 'Get a list of job applications submitted by the logged-in student user. Call this if the user asks "What is the status of my applications?"',
                parameters: z.object({}),
                execute: async () => {
                    const applications = await db.application.findMany({
                        where: { studentId: session.user.id },
                        include: {
                            job: {
                                select: { title: true, company: true, location: true }
                            }
                        },
                        orderBy: { appliedAt: 'desc' },
                        take: 10
                    });
                    return {
                        totalApplied: applications.length,
                        applications: applications.map(app => ({
                            status: app.status,
                            appliedAt: app.appliedAt,
                            jobTitle: app.job.title,
                            company: app.job.company
                        }))
                    };
                }
            });

            aiTools.checkMyEligibility = tool({
                description: 'Check if the logged-in student is eligible for a specific job based on their CGPA and branch. Requirement: Provide the job title or company.',
                parameters: z.object({
                    jobTitle: z.string().describe('The title of the job to check eligibility for.'),
                    companyName: z.string().optional().describe('The name of the company.')
                }),
                execute: async ({ jobTitle, companyName }) => {
                    const profile = await db.profile.findUnique({
                        where: { userId: session.user.id },
                    });

                    if (!profile) return { error: "Please complete your profile first." };

                    const job = await db.job.findFirst({
                        where: {
                            title: { contains: jobTitle },
                            ...(companyName ? { company: { contains: companyName } } : {})
                        },
                        include: { eligibleBranches: true }
                    });

                    if (!job) return { error: "Job not found. Please provide exact title." };

                    const branchMatch = job.eligibleBranches.length === 0 ||
                        job.eligibleBranches.some(b => b.name === profile.branch);

                    const cgpaMatch = profile.cgpa >= job.minCgpa;
                    const genderMatch = job.eligibleGender === "Any" || job.eligibleGender === (profile.gender || "Male");

                    const reasons = [];
                    if (!branchMatch) reasons.push(`Your branch (${profile.branch}) is not in the eligible list.`);
                    if (!cgpaMatch) reasons.push(`Required CGPA is ${job.minCgpa}, yours is ${profile.cgpa}.`);
                    if (!genderMatch) reasons.push(`This job is specifically for ${job.eligibleGender} candidates.`);

                    return {
                        isEligible: branchMatch && cgpaMatch && genderMatch,
                        jobDetails: { title: job.title, company: job.company },
                        requirements: {
                            minCgpa: job.minCgpa,
                            branches: job.eligibleBranches.map(b => b.name),
                            gender: job.eligibleGender
                        },
                        reasons
                    };
                }
            });

            aiTools.getRecommendedJobsForMe = tool({
                description: 'Get a list of jobs that the logged-in student is compatible with based on their current CGPA and Branch. Returns the top 5 matches.',
                parameters: z.object({}),
                execute: async () => {
                    const profile = await db.profile.findUnique({
                        where: { userId: session.user.id },
                    });

                    if (!profile) return { error: "Please complete your profile first." };

                    // Find jobs where CGPA requirement is met
                    const potentialJobs = await db.job.findMany({
                        where: {
                            isActive: true,
                            minCgpa: { lte: profile.cgpa }
                        },
                        include: { eligibleBranches: true },
                        take: 20
                    });

                    // Filter by branch match (if branches are specified)
                    const recommended = potentialJobs.filter(job =>
                        job.eligibleBranches.length === 0 ||
                        job.eligibleBranches.some(b => b.name === profile.branch)
                    ).slice(0, 5);

                    return {
                        studentStats: { cgpa: profile.cgpa, branch: profile.branch },
                        recommendedCount: recommended.length,
                        jobs: recommended.map(j => ({
                            title: j.title,
                            company: j.company,
                            location: j.location,
                            minCgpa: j.minCgpa
                        }))
                    };
                }
            });
        }
    }

    const result = await streamText({
        model: google('gemini-2.5-flash'),
        system: systemPrompt,
        messages,
        tools: aiTools,
        maxSteps: 5,
    });

    return result.toDataStreamResponse();
}
