PRAGMA foreign_keys=OFF;

BEGIN;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL CHECK (length(trim("name")) BETWEEN 2 AND 80),
    "email" TEXT CHECK (length("email") BETWEEN 3 AND 254),
    "username" TEXT CHECK (length("username") BETWEEN 3 AND 32 AND "username" GLOB '[a-z0-9]*' AND "username" NOT GLOB '*[^a-z0-9_.-]*'),
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER' CHECK ("role" IN ('ADMIN', 'TRAINER', 'USER')),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE' CHECK ("status" IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("id", "name", "email", "password", "phone", "avatarUrl", "role", "status", "lastLoginAt", "createdAt", "updatedAt")
SELECT "id", "name", "email", "password", "phone", "avatarUrl", "role", "status", "lastLoginAt", "createdAt", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
COMMIT;

PRAGMA foreign_keys=ON;
PRAGMA foreign_key_check;
