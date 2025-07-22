-- CreateTable
CREATE TABLE "CommuteTime" (
    "id" SERIAL NOT NULL,
    "flatId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "timeMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommuteTime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommuteTime_flatId_userId_key" ON "CommuteTime"("flatId", "userId");

-- AddForeignKey
ALTER TABLE "CommuteTime" ADD CONSTRAINT "CommuteTime_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommuteTime" ADD CONSTRAINT "CommuteTime_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
