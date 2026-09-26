-- CreateIndex
CREATE INDEX "bookings_tutorId_sessionDate_status_idx" ON "bookings"("tutorId", "sessionDate", "status");

-- CreateIndex
CREATE INDEX "bookings_studentId_status_idx" ON "bookings"("studentId", "status");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "tutorAvailability_tutorId_dayOfWeek_isActive_idx" ON "tutorAvailability"("tutorId", "dayOfWeek", "isActive");

-- CreateIndex
CREATE INDEX "tutorProfiles_verificationStatus_categoriesId_idx" ON "tutorProfiles"("verificationStatus", "categoriesId");

-- CreateIndex
CREATE INDEX "tutorProfiles_hourlyRate_idx" ON "tutorProfiles"("hourlyRate");

-- CreateIndex
CREATE INDEX "tutorProfiles_totalRating_idx" ON "tutorProfiles"("totalRating");
