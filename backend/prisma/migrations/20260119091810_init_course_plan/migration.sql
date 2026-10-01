/*
  Warnings:

  - You are about to drop the `planned_modules` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "planned_modules" DROP CONSTRAINT "planned_modules_user_id_fkey";

-- DropTable
DROP TABLE "planned_modules";

-- CreateTable
CREATE TABLE "course_plans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "modules" JSONB NOT NULL DEFAULT '[]',
    "graduation_requirements" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_plans_user_id_key" ON "course_plans"("user_id");

-- CreateIndex
CREATE INDEX "course_plans_user_id_idx" ON "course_plans"("user_id");

-- AddForeignKey
ALTER TABLE "course_plans" ADD CONSTRAINT "course_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
