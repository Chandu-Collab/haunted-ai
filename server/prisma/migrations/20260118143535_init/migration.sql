-- CreateTable
CREATE TABLE "UserMemory" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "memoryContent" TEXT NOT NULL,
    "memoryType" TEXT NOT NULL,
    "context" TEXT,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "emotionalWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "tags" TEXT,
    "embedding" TEXT,
    "accessCount" INTEGER NOT NULL DEFAULT 1,
    "lastAccessed" TIMESTAMP(3),
    "isDecaying" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GhostRelationship" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "ghostPersonalityId" TEXT NOT NULL,
    "trustLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "intimacyLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "fearLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "affectionLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "conversationCount" INTEGER NOT NULL DEFAULT 0,
    "totalInteractionTime" INTEGER NOT NULL DEFAULT 0,
    "relationshipMilestones" TEXT,
    "personalNicknames" TEXT,
    "sharedMemories" TEXT,
    "conflictHistory" TEXT,
    "relationshipStatus" TEXT NOT NULL DEFAULT 'stranger',
    "lastInteraction" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GhostRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SentimentAnalysis" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "messageContent" TEXT NOT NULL,
    "overallSentiment" DOUBLE PRECISION NOT NULL,
    "emotionJoy" DOUBLE PRECISION NOT NULL,
    "emotionSadness" DOUBLE PRECISION NOT NULL,
    "emotionAnger" DOUBLE PRECISION NOT NULL,
    "emotionFear" DOUBLE PRECISION NOT NULL,
    "emotionSurprise" DOUBLE PRECISION NOT NULL,
    "emotionDisgust" DOUBLE PRECISION NOT NULL,
    "stressLevel" DOUBLE PRECISION NOT NULL,
    "engagementLevel" DOUBLE PRECISION NOT NULL,
    "detectedTopics" TEXT,
    "contextualFactors" TEXT,
    "analysisDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentimentAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GhostProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "backstory" TEXT,
    "emoji" TEXT,
    "color" TEXT,
    "appearance" JSONB NOT NULL,
    "personalityTraits" JSONB NOT NULL,
    "activityLevel" TEXT NOT NULL,
    "voiceSettings" JSONB NOT NULL,
    "preferences" JSONB NOT NULL,
    "abilities" JSONB NOT NULL,
    "stats" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GhostProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievements" JSONB NOT NULL,
    "energy" INTEGER NOT NULL,
    "roomsVisited" JSONB NOT NULL,
    "meta" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isGhost" BOOLEAN NOT NULL,
    "sessionId" TEXT NOT NULL,
    "personalityId" TEXT NOT NULL,
    "moodAnalysis" JSONB NOT NULL,
    "contextualFactors" JSONB NOT NULL,
    "imageUrl" TEXT,
    "imageAnalysis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "roomId" INTEGER NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "decorations" JSONB NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "privacy" TEXT NOT NULL,
    "inviteCode" VARCHAR(10),
    "maxParticipants" INTEGER NOT NULL,
    "participantCount" INTEGER NOT NULL,
    "chatMode" TEXT NOT NULL,
    "aiModerationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiInterventionDelay" INTEGER NOT NULL,
    "aiSettings" JSONB NOT NULL,
    "conversationMetrics" JSONB NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "theme" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomUser" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "nickname" TEXT NOT NULL,
    "greeting" TEXT,
    "goodbye" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
