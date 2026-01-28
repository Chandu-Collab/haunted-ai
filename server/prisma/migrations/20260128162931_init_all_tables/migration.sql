-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isGhost" BOOLEAN NOT NULL DEFAULT false,
    "sessionId" TEXT NOT NULL,
    "personalityId" VARCHAR,
    "moodAnalysis" JSONB,
    "contextualFactors" JSONB,
    "imageUrl" VARCHAR,
    "imageAnalysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" INTEGER,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'haunted',
    "description" TEXT,
    "privacy" TEXT NOT NULL DEFAULT 'public',
    "inviteCode" TEXT,
    "maxParticipants" INTEGER NOT NULL DEFAULT 10,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "chatMode" TEXT DEFAULT 'balanced',
    "aiModerationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "aiInterventionDelay" INTEGER NOT NULL DEFAULT 30,
    "aiSettings" JSONB,
    "conversationMetrics" JSONB,
    "ownerId" INTEGER,
    "decorations" JSONB,
    "theme" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomUser" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RoomUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" VARCHAR,
    "nickname" VARCHAR,
    "greeting" VARCHAR,
    "goodbye" VARCHAR,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
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
    "backstory" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '👻',
    "color" VARCHAR,
    "personalityTraits" JSONB,
    "activityLevel" TEXT NOT NULL DEFAULT 'moderate',
    "voiceSettings" JSONB,
    "preferences" JSONB,
    "abilities" JSONB,
    "appearance" JSONB,
    "stats" JSONB,
    "createdBy" VARCHAR,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GhostProfile_pkey" PRIMARY KEY ("id")
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
    "relationshipMilestones" JSONB,
    "personalNicknames" JSONB,
    "sharedMemories" JSONB,
    "conflictHistory" JSONB,
    "relationshipStatus" TEXT NOT NULL DEFAULT 'stranger',
    "lastInteraction" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GhostRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "achievements" JSONB,
    "energy" INTEGER NOT NULL DEFAULT 80,
    "roomsVisited" JSONB,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "UserMemory" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "memoryContent" TEXT NOT NULL,
    "memoryType" TEXT NOT NULL DEFAULT 'conversation',
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

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Room_inviteCode_key" ON "Room"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "RoomUser_roomId_userId_key" ON "RoomUser"("roomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GhostProfile_name_key" ON "GhostProfile"("name");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomUser" ADD CONSTRAINT "RoomUser_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomUser" ADD CONSTRAINT "RoomUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentimentAnalysis" ADD CONSTRAINT "SentimentAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostRelationship" ADD CONSTRAINT "GhostRelationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMemory" ADD CONSTRAINT "UserMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
