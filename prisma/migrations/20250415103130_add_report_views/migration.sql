-- CreateTable
CREATE TABLE "ReportView" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewerIp" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "ReportView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportView_reportId_idx" ON "ReportView"("reportId");

-- AddForeignKey
ALTER TABLE "ReportView" ADD CONSTRAINT "ReportView_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
