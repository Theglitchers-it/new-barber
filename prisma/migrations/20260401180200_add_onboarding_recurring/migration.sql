-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "isRecurringInstance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentAppointmentId" TEXT,
ADD COLUMN     "recurringEndDate" TIMESTAMP(3),
ADD COLUMN     "recurringPattern" TEXT;

-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_parentAppointmentId_fkey" FOREIGN KEY ("parentAppointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
