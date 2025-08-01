/*
  Warnings:

  - Added the required column `survey_id` to the `SurveyResponse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Survey" ADD COLUMN     "is_completed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "gender" SET NOT NULL,
ALTER COLUMN "gender" SET DEFAULT 'both',
ALTER COLUMN "gender" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "SurveyResponse" ADD COLUMN     "survey_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
