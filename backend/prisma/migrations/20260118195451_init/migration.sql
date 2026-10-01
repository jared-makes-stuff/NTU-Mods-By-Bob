-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'user',
    "oauth_accounts" JSONB DEFAULT '[]',
    "avatar_url" VARCHAR(500),
    "avatar_data" BYTEA,
    "avatar_mime_type" VARCHAR(50),
    "settings" JSONB,
    "privacy" JSONB,
    "email_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_change_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "new_email" VARCHAR(255) NOT NULL,
    "old_email" VARCHAR(255),
    "code_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "revert_token_hash" VARCHAR(64),
    "revert_expires_at" TIMESTAMP(3),
    "revert_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "code" VARCHAR(20) NOT NULL,
    "semester" VARCHAR(10) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "au" REAL NOT NULL,
    "school" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "prerequisites" JSONB,
    "department" VARCHAR(100),
    "grade_type" VARCHAR(50),
    "mutual_exclusions" TEXT,
    "not_available_to" TEXT,
    "not_available_to_all_with" TEXT,
    "bde" BOOLEAN NOT NULL DEFAULT false,
    "unrestricted_elective" BOOLEAN NOT NULL DEFAULT false,
    "exam_date_time" VARCHAR(50),
    "exam_duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("code","semester")
);

-- CreateTable
CREATE TABLE "indexes" (
    "module_code" VARCHAR(20) NOT NULL,
    "index_number" VARCHAR(20) NOT NULL,
    "semester" VARCHAR(10) NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "day" VARCHAR(3) NOT NULL,
    "start_time" VARCHAR(4) NOT NULL,
    "end_time" VARCHAR(4) NOT NULL,
    "venue" VARCHAR(100) NOT NULL,
    "group" VARCHAR(20),
    "weeks" INTEGER[],
    "vacancy" INTEGER,
    "waitlist" INTEGER,
    "last_vacancy_check_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indexes_pkey" PRIMARY KEY ("module_code","index_number","semester","type","day","start_time")
);

-- CreateTable
CREATE TABLE "timetables" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "semester" VARCHAR(50) NOT NULL,
    "selections" JSONB NOT NULL DEFAULT '[]',
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "share_link_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_modules" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "module_code" VARCHAR(20) NOT NULL,
    "year" INTEGER NOT NULL,
    "semester" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    "grade" VARCHAR(5),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planned_modules_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "module_reviews" (
    "id" UUID NOT NULL,
    "module_code" VARCHAR(20) NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" REAL NOT NULL,
    "content" TEXT,
    "assessment_weightage" JSONB,
    "term" VARCHAR(50),
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_topics" (
    "id" UUID NOT NULL,
    "module_code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "duration" VARCHAR(50),
    "week_taught" INTEGER,
    "suggested_edit" TEXT,
    "edit_reason" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "parent_id" UUID,
    "submitted_by" UUID NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_topics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "email_verification_codes_expires_at_idx" ON "email_verification_codes"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_codes_user_id_key" ON "email_verification_codes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_change_requests_user_id_key" ON "email_change_requests"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_change_requests_revert_token_hash_key" ON "email_change_requests"("revert_token_hash");

-- CreateIndex
CREATE INDEX "email_change_requests_new_email_idx" ON "email_change_requests"("new_email");

-- CreateIndex
CREATE INDEX "email_change_requests_expires_at_idx" ON "email_change_requests"("expires_at");

-- CreateIndex
CREATE INDEX "email_change_requests_revert_expires_at_idx" ON "email_change_requests"("revert_expires_at");

-- CreateIndex
CREATE INDEX "password_reset_codes_expires_at_idx" ON "password_reset_codes"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_codes_user_id_key" ON "password_reset_codes"("user_id");

-- CreateIndex
CREATE INDEX "modules_school_idx" ON "modules"("school");

-- CreateIndex
CREATE INDEX "modules_au_idx" ON "modules"("au");

-- CreateIndex
CREATE INDEX "modules_semester_idx" ON "modules"("semester");

-- CreateIndex
CREATE INDEX "modules_code_idx" ON "modules"("code");

-- CreateIndex
CREATE INDEX "indexes_module_code_idx" ON "indexes"("module_code");

-- CreateIndex
CREATE INDEX "indexes_index_number_idx" ON "indexes"("index_number");

-- CreateIndex
CREATE INDEX "indexes_semester_idx" ON "indexes"("semester");

-- CreateIndex
CREATE INDEX "indexes_day_idx" ON "indexes"("day");

-- CreateIndex
CREATE INDEX "indexes_module_code_semester_idx" ON "indexes"("module_code", "semester");

-- CreateIndex
CREATE INDEX "indexes_last_vacancy_check_at_idx" ON "indexes"("last_vacancy_check_at");

-- CreateIndex
CREATE UNIQUE INDEX "timetables_share_link_id_key" ON "timetables"("share_link_id");

-- CreateIndex
CREATE INDEX "timetables_user_id_idx" ON "timetables"("user_id");

-- CreateIndex
CREATE INDEX "timetables_share_link_id_idx" ON "timetables"("share_link_id");

-- CreateIndex
CREATE INDEX "planned_modules_user_id_idx" ON "planned_modules"("user_id");

-- CreateIndex
CREATE INDEX "planned_modules_module_code_idx" ON "planned_modules"("module_code");

-- CreateIndex
CREATE UNIQUE INDEX "planned_modules_user_id_module_code_year_semester_key" ON "planned_modules"("user_id", "module_code", "year", "semester");


-- CreateIndex
CREATE INDEX "module_reviews_module_code_idx" ON "module_reviews"("module_code");

-- CreateIndex
CREATE INDEX "module_reviews_user_id_idx" ON "module_reviews"("user_id");

-- CreateIndex
CREATE INDEX "module_reviews_rating_idx" ON "module_reviews"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "module_reviews_module_code_user_id_key" ON "module_reviews"("module_code", "user_id");

-- CreateIndex
CREATE INDEX "module_topics_module_code_idx" ON "module_topics"("module_code");

-- CreateIndex
CREATE INDEX "module_topics_parent_id_idx" ON "module_topics"("parent_id");

-- CreateIndex
CREATE INDEX "module_topics_submitted_by_idx" ON "module_topics"("submitted_by");

-- AddForeignKey
ALTER TABLE "email_verification_codes" ADD CONSTRAINT "email_verification_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_change_requests" ADD CONSTRAINT "email_change_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_codes" ADD CONSTRAINT "password_reset_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indexes" ADD CONSTRAINT "indexes_module_code_semester_fkey" FOREIGN KEY ("module_code", "semester") REFERENCES "modules"("code", "semester") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_modules" ADD CONSTRAINT "planned_modules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "module_reviews" ADD CONSTRAINT "module_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_topics" ADD CONSTRAINT "module_topics_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_topics" ADD CONSTRAINT "module_topics_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "module_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;


